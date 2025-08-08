// Inicialização principal do editor 3D
window.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById('renderCanvas');
    var engine = new BABYLON.Engine(canvas, true);
    var objectList = [];
    var objectListEl = document.getElementById('object-list');
    var objectPropertiesEl = document.getElementById('object-properties');
    var selectedIdx = null;
    var gizmoManager = null;
    var gizmoMode = 'move';

    // Função para atualizar campos da bottom bar
    function updateBottomBar() {
        const colorInput = document.getElementById('edit-color');
        const sizeInput = document.getElementById('edit-size');
        const posX = document.getElementById('edit-pos-x');
        const posY = document.getElementById('edit-pos-y');
        const posZ = document.getElementById('edit-pos-z');
        const rotX = document.getElementById('edit-rot-x');
        const rotY = document.getElementById('edit-rot-y');
        const rotZ = document.getElementById('edit-rot-z');
        const propSelect = document.getElementById('edit-props');
        const propValue = document.getElementById('edit-prop-value');
        const objectInfo = document.getElementById('selected-object-info');
        
        if (selectedIdx === null || !objectList[selectedIdx]) {
            objectInfo.textContent = 'Nenhum objeto selecionado - Clique em um objeto para editar';
            colorInput.value = '#888888';
            sizeInput.value = '';
            posX.value = posY.value = posZ.value = '';
            rotX.value = rotY.value = rotZ.value = '';
            propValue.checked = false;
            
            // Desabilitar todos os campos
            colorInput.disabled = true;
            sizeInput.disabled = true;
            posX.disabled = posY.disabled = posZ.disabled = true;
            rotX.disabled = rotY.disabled = rotZ.disabled = true;
            propSelect.disabled = true;
            propValue.disabled = true;
            return;
        }
        
        // Habilitar todos os campos
        colorInput.disabled = false;
        sizeInput.disabled = false;
        posX.disabled = posY.disabled = posZ.disabled = false;
        rotX.disabled = rotY.disabled = rotZ.disabled = false;
        propSelect.disabled = false;
        propValue.disabled = false;
        
        const obj = objectList[selectedIdx];
        
        // Atualizar informações do objeto
        let infoText = `${obj.name} (${obj.type})`;
        if (obj.props) {
            const activeProps = Object.keys(obj.props).filter(key => obj.props[key]);
            if (activeProps.length > 0) {
                infoText += ` - Propriedades: ${activeProps.join(', ')}`;
            }
        }
        objectInfo.textContent = infoText;
        
        // Cor
        if (obj.mesh.material && obj.mesh.material.diffuseColor) {
            const c = obj.mesh.material.diffuseColor;
            colorInput.value = '#' + ((1 << 24) + (Math.round(c.r * 255) << 16) + (Math.round(c.g * 255) << 8) + Math.round(c.b * 255)).toString(16).slice(1);
        } else if (obj.originalMeshes && obj.originalMeshes.length > 0) {
            // Para objetos importados, usar a cor do primeiro mesh que tiver material
            const firstMeshWithMaterial = obj.originalMeshes.find(mesh => mesh.material && mesh.material.diffuseColor);
            if (firstMeshWithMaterial) {
                const c = firstMeshWithMaterial.material.diffuseColor;
                colorInput.value = '#' + ((1 << 24) + (Math.round(c.r * 255) << 16) + (Math.round(c.g * 255) << 8) + Math.round(c.b * 255)).toString(16).slice(1);
            } else {
                colorInput.value = '#888888';
            }
        } else {
            colorInput.value = '#888888';
        }
        // Tamanho
        if (obj.type === 'plane') {
            sizeInput.value = obj.mesh.scaling.x.toFixed(2);
        } else {
            sizeInput.value = obj.mesh.scaling.x.toFixed(2);
        }
        // Posição
        posX.value = obj.mesh.position.x.toFixed(2);
        posY.value = obj.mesh.position.y.toFixed(2);
        posZ.value = obj.mesh.position.z.toFixed(2);
        // Rotação
        rotX.value = obj.mesh.rotation.x.toFixed(2);
        rotY.value = obj.mesh.rotation.y.toFixed(2);
        rotZ.value = obj.mesh.rotation.z.toFixed(2);
        // Propriedade
        // Atualiza o dropdown para o primeiro valor true, se houver
        let found = false;
        if (obj.props) {
            for (const key of ['movel','perigo','plataforma','decorativo']) {
                if (obj.props[key]) {
                    propSelect.value = key;
                    propValue.checked = true;
                    found = true;
                    break;
                }
            }
        }
        if (!found) {
            propSelect.value = 'movel';
            propValue.checked = obj.props && obj.props['movel'];
        }
    }

    // Atualiza bottom bar ao selecionar objeto
    function selectObject(idx) {
        objectList.forEach((obj, i) => {
            obj.selected = (i === idx);
            if (obj.selected) {
                // Para objetos importados, aplicar emissive nos meshes filhos
                if (obj.originalMeshes) {
                    obj.originalMeshes.forEach(mesh => {
                        if (mesh.material) {
                            mesh.material.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
                        }
                    });
                } else if (obj.mesh.material) {
                    obj.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
                }
            } else {
                // Remover emissive
                if (obj.originalMeshes) {
                    obj.originalMeshes.forEach(mesh => {
                        if (mesh.material) {
                            mesh.material.emissiveColor = BABYLON.Color3.Black();
                        }
                    });
                } else if (obj.mesh.material) {
                    obj.mesh.material.emissiveColor = BABYLON.Color3.Black();
                }
            }
        });
        selectedIdx = idx;
        updateObjectList();
        updateBottomBar();
        if (gizmoManager) {
            if (idx !== null && objectList[idx]) {
                gizmoManager.attachToMesh(objectList[idx].mesh);
                updateGizmoMode(gizmoMode);
            } else {
                gizmoManager.attachToMesh(null);
            }
        }
    }

    // Eventos dos campos da bottom bar
    document.getElementById('edit-color').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        const obj = objectList[selectedIdx];
        const hex = e.target.value;
        const r = parseInt(hex.slice(1,3),16)/255;
        const g = parseInt(hex.slice(3,5),16)/255;
        const b = parseInt(hex.slice(5,7),16)/255;
        
        if (obj.mesh.material && obj.mesh.material.diffuseColor) {
            obj.mesh.material.diffuseColor = new BABYLON.Color3(r,g,b);
        } else if (obj.originalMeshes) {
            // Aplicar cor a todos os meshes filhos que têm material
            obj.originalMeshes.forEach(mesh => {
                if (mesh.material && mesh.material.diffuseColor) {
                    mesh.material.diffuseColor = new BABYLON.Color3(r,g,b);
                }
            });
        }
    };
    document.getElementById('edit-size').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        const obj = objectList[selectedIdx];
        const val = parseFloat(e.target.value);
        obj.mesh.scaling.x = obj.mesh.scaling.y = obj.mesh.scaling.z = val;
    };
    document.getElementById('edit-pos-x').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        objectList[selectedIdx].mesh.position.x = parseFloat(e.target.value);
    };
    document.getElementById('edit-pos-y').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        objectList[selectedIdx].mesh.position.y = parseFloat(e.target.value);
    };
    document.getElementById('edit-pos-z').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        objectList[selectedIdx].mesh.position.z = parseFloat(e.target.value);
    };
    document.getElementById('edit-rot-x').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        objectList[selectedIdx].mesh.rotation.x = parseFloat(e.target.value);
    };
    document.getElementById('edit-rot-y').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        objectList[selectedIdx].mesh.rotation.y = parseFloat(e.target.value);
    };
    document.getElementById('edit-rot-z').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        objectList[selectedIdx].mesh.rotation.z = parseFloat(e.target.value);
    };
    document.getElementById('edit-props').onchange = function(e) {
        updateBottomBar();
    };
    document.getElementById('edit-prop-value').oninput = function(e) {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        const obj = objectList[selectedIdx];
        const prop = document.getElementById('edit-props').value;
        obj.props[prop] = e.target.checked;
    };

    // Atualiza bottom bar ao iniciar (após variáveis e DOM)
    updateBottomBar();

    // Função para atualizar o modo do gizmo
    function updateGizmoMode(mode) {
        gizmoMode = mode;
        if (gizmoManager) {
            gizmoManager.positionGizmoEnabled = (mode === 'move');
            gizmoManager.rotationGizmoEnabled = (mode === 'rotate');
            gizmoManager.scaleGizmoEnabled = (mode === 'scale');
        }
    }

    // Criação da cena
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color3(0.8, 0.9, 1);

    var camera = new BABYLON.ArcRotateCamera('camera', Math.PI / 2, Math.PI / 3, 16, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);
    var light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.9;
    var ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 20, height: 20 }, scene);
    ground.position.y = 0;
    var groundMat = new BABYLON.StandardMaterial('groundMat', scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    ground.material = groundMat;
        // Adiciona o plano à lista de objetos
        objectList.push({
            name: 'ground',
            type: 'plane',
            mesh: ground,
            props: { plataforma: true, movel: false, perigo: false, decorativo: false },
            selected: false
        });
        updateObjectList();

    // Gizmo Manager
    gizmoManager = new BABYLON.GizmoManager(scene);
    updateGizmoMode(gizmoMode);

    // Função para atualizar lista lateral
    function updateObjectList() {
        objectListEl.innerHTML = '';
        objectList.forEach((obj, idx) => {
            var li = document.createElement('li');
            li.textContent = obj.name + ' (' + obj.type + ')';
            li.onclick = () => selectObject(idx);
            if (obj.selected) li.classList.add('selected');
            objectListEl.appendChild(li);
        });
        updateObjectProperties();
    }

    // Função para atualizar painel de propriedades
    function updateObjectProperties() {
        objectPropertiesEl.innerHTML = '';
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        var obj = objectList[selectedIdx];
        var props = obj.props || {movel:false, perigo:false, plataforma:false, decorativo:false};
        obj.props = props;
        var html = '<h3>Propriedades</h3>';
        html += '<label><input type="checkbox" id="prop-movel" ' + (props.movel ? 'checked' : '') + '> Móvel</label><br>';
        html += '<label><input type="checkbox" id="prop-perigo" ' + (props.perigo ? 'checked' : '') + '> Perigo</label><br>';
        html += '<label><input type="checkbox" id="prop-plataforma" ' + (props.plataforma ? 'checked' : '') + '> Plataforma</label><br>';
        html += '<label><input type="checkbox" id="prop-decorativo" ' + (props.decorativo ? 'checked' : '') + '> Decorativo</label><br>';
        objectPropertiesEl.innerHTML = html;
        document.getElementById('prop-movel').onchange = function(e) { props.movel = e.target.checked; };
        document.getElementById('prop-perigo').onchange = function(e) { props.perigo = e.target.checked; };
        document.getElementById('prop-plataforma').onchange = function(e) { props.plataforma = e.target.checked; };
        document.getElementById('prop-decorativo').onchange = function(e) { props.decorativo = e.target.checked; };
    }

    // Adição de objetos
    document.getElementById('add-cube').onclick = function() {
        var box = BABYLON.MeshBuilder.CreateBox('cube_' + objectList.length, { size: 2 }, scene);
        box.position.y = 1;
        var mat = new BABYLON.StandardMaterial('mat', scene);
        mat.diffuseColor = new BABYLON.Color3(0.4, 0.8, 0.3);
        box.material = mat;
        objectList.push({ 
            name: box.name, 
            mesh: box, 
            type: 'Cubo', 
            selected: false,
            props: { movel: false, perigo: false, plataforma: false, decorativo: true }
        });
        updateObjectList();
    };
    document.getElementById('add-sphere').onclick = function() {
        var sphere = BABYLON.MeshBuilder.CreateSphere('sphere_' + objectList.length, { diameter: 2 }, scene);
        sphere.position.y = 1;
        var mat = new BABYLON.StandardMaterial('mat', scene);
        mat.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.9);
        sphere.material = mat;
        objectList.push({ 
            name: sphere.name, 
            mesh: sphere, 
            type: 'Esfera', 
            selected: false,
            props: { movel: false, perigo: false, plataforma: false, decorativo: true }
        });
        updateObjectList();
    };
    document.getElementById('add-plane').onclick = function() {
    var plane = BABYLON.MeshBuilder.CreatePlane('plane_' + objectList.length, { size: 20 }, scene);
    plane.position.y = 1;
    var mat = new BABYLON.StandardMaterial('mat', scene);
    mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.8);
    plane.material = mat;
    objectList.push({ name: plane.name, mesh: plane, type: 'plane', props: { plataforma: true, movel: false, perigo: false, decorativo: false }, selected: false });
    updateObjectList();
    };

    // Seleção visual (gizmo cuida do movimento)
    scene.onPointerObservable.add(function(pointerInfo) {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            var pickResult = scene.pick(scene.pointerX, scene.pointerY);
            if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.name !== 'ground') {
                // Procurar objeto na lista por mesh direta ou por meshes filhos
                var idx = objectList.findIndex(obj => {
                    if (obj.mesh === pickResult.pickedMesh) {
                        return true;
                    }
                    // Verificar se é um mesh filho de objeto importado
                    if (obj.originalMeshes) {
                        return obj.originalMeshes.includes(pickResult.pickedMesh);
                    }
                    return false;
                });
                if (idx >= 0) selectObject(idx);
            }
        }
    });

    // Exportar cena para JSON
    document.getElementById('export-json').onclick = function() {
        const data = objectList.map(obj => ({
            name: obj.name,
            type: obj.type,
            position: { x: obj.mesh.position.x, y: obj.mesh.position.y, z: obj.mesh.position.z },
            rotation: { x: obj.mesh.rotation.x, y: obj.mesh.rotation.y, z: obj.mesh.rotation.z },
            scaling: { x: obj.mesh.scaling.x, y: obj.mesh.scaling.y, z: obj.mesh.scaling.z },
            props: obj.props || {},
            // Para objetos importados, salvar metadados
            isImported: !!obj.originalMeshes,
            assetName: obj.assetName || null
        }));
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fase.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Importar cena de JSON
    document.getElementById('import-json').onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                objectList.forEach(obj => { if (obj.mesh) obj.mesh.dispose(); });
                objectList.length = 0;
                selectedIdx = null;
                data.forEach(objData => {
                    let mesh;
                    if (objData.type === 'Cubo') {
                        mesh = BABYLON.MeshBuilder.CreateBox(objData.name, { size: 2 }, scene);
                    } else if (objData.type === 'Esfera') {
                        mesh = BABYLON.MeshBuilder.CreateSphere(objData.name, { diameter: 2 }, scene);
                    } else if (objData.type === 'plane') {
                        mesh = BABYLON.MeshBuilder.CreatePlane(objData.name, { size: 20 }, scene);
                    } else {
                        return;
                    }
                    mesh.position = new BABYLON.Vector3(objData.position.x, objData.position.y, objData.position.z);
                    mesh.rotation = new BABYLON.Vector3(objData.rotation.x, objData.rotation.y, objData.rotation.z);
                    mesh.scaling = new BABYLON.Vector3(objData.scaling.x, objData.scaling.y, objData.scaling.z);
                    var mat = new BABYLON.StandardMaterial('mat', scene);
                    mat.diffuseColor = (objData.type === 'Cubo') ? new BABYLON.Color3(0.4, 0.8, 0.3)
                        : (objData.type === 'Esfera') ? new BABYLON.Color3(0.7, 0.5, 0.9)
                        : new BABYLON.Color3(0.2, 0.6, 0.8);
                    mesh.material = mat;
                    objectList.push({
                        name: objData.name,
                        mesh,
                        type: objData.type,
                        selected: false,
                        props: objData.props || {movel:false, perigo:false, plataforma:false, decorativo:false}
                    });
                });
                updateObjectList();
                if (gizmoManager) gizmoManager.attachToMesh(null);
            } catch (err) {
                alert('Erro ao importar JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    };

    // Botões de modo do gizmo
    document.getElementById('gizmo-move').onclick = function() {
        gizmoMode = 'move';
        updateGizmoMode(gizmoMode);
    };
    document.getElementById('gizmo-rotate').onclick = function() {
        gizmoMode = 'rotate';
        updateGizmoMode(gizmoMode);
    };
    document.getElementById('gizmo-scale').onclick = function() {
        gizmoMode = 'scale';
        updateGizmoMode(gizmoMode);
    };

    // Browser de Objetos 3D - Carregamento Automático dos Assets
    var loadedAssets = [];
    var assetsBrowserEl = document.getElementById('assets-browser');

    // Função para carregar automaticamente todos os modelos 3D dos assets
    function loadProjectAssets() {
        console.log('🔍 Carregando assets do projeto...');
        assetsBrowserEl.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">🔄 Carregando modelos 3D do projeto...</div>';
        
        // Lista de todos os arquivos GLB encontrados no projeto
        const projectAssets = [
            // Kenney Fantasy Town Kit
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/balcony-wall-fence.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/balcony-wall.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/banner-green.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/banner-red.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/blade.glb', category: 'Props' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/cart-high.glb', category: 'Vehicles' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/cart.glb', category: 'Vehicles' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/chimney-base.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/chimney-top.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/chimney.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fence-broken.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fence-curved.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fence-gate.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fence.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-center.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-corner-inner-square.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-corner-inner.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-corner.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-curved.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-edge.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-round-detail.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-round.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-square-detail.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/fountain-square.glb', category: 'Decorations' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/hedge-curved.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/hedge-gate.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/hedge-large-curved.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/hedge-large-gate.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/hedge-large.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/hedge.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/lantern.glb', category: 'Lighting' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/overhang.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/pillar-stone.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/pillar-wood.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/planks-half.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/planks-opening.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/planks.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/poles-horizontal.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/poles.glb', category: 'Structures' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-bend.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-corner-inner.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-corner.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-curb-end.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-curb.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-edge-slope.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-edge.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road-slope.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/road.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/rock-large.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/rock-small.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/rock-wide.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/tree-crooked.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/tree-high-crooked.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/tree-high-round.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/tree-high.glb', category: 'Nature' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/tree.glb', category: 'Nature' },
            // Walls and Roofs
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-arch-top-detail.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-arch-top.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-arch.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-block-half.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-block.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-broken.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-corner-detail.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-corner-diagonal-half.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-corner-diagonal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-corner-edge.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-corner.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-curved.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-detail-cross.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-detail-diagonal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-detail-horizontal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-diagonal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-door.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-doorway-base.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-doorway-round.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-doorway-square-wide-curved.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-doorway-square-wide.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-doorway-square.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-half.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-rounded.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-side.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-slope.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-window-glass.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-window-round.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-window-shutters.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-window-small.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-window-stone.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall.glb', category: 'Buildings' },
            // Wood Walls
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-arch-top-detail.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-arch-top.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-arch.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-block-half.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-block.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-broken.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-corner-diagonal-half.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-corner-diagonal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-corner-edge.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-corner.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-curved.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-detail-cross.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-detail-diagonal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-detail-horizontal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-diagonal.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-door.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-doorway-base.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-doorway-round.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-doorway-square-wide-curved.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-doorway-square-wide.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-doorway-square.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-half.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-rounded.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-side.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-slope.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-window-glass.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-window-round.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-window-shutters.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-window-small.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood-window-stone.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wall-wood.glb', category: 'Buildings' },
            // Roofs
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-corner-inner.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-corner-round.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-corner.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-flat.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-gable-detail.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-gable-end.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-gable-top.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-gable.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-corner-round.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-corner.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-cornerinner.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-flat.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-gable-detail.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-gable-end.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-gable-top.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-gable.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-left.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-point.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-right.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high-window.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-high.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-left.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-point.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-right.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof-window.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/roof.glb', category: 'Buildings' },
            // Stairs and Special Buildings
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-full-corner-inner.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-full-corner-outer.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-full.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-stone-corner.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-stone-handrail.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-stone-round.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-stone.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-wide-stone-handrail.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-wide-stone.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-wide-wood-handrail.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-wide-wood.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-wood-handrail.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stairs-wood.glb', category: 'Infrastructure' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stall-bench.glb', category: 'Props' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stall-green.glb', category: 'Props' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stall-red.glb', category: 'Props' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stall-stool.glb', category: 'Props' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/stall.glb', category: 'Props' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/watermill-wide.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/watermill.glb', category: 'Buildings' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/wheel.glb', category: 'Props' },
            { path: '../assets/models/kenney_fantasy-town-kit_2.0/windmill.glb', category: 'Buildings' }
        ];

        // Converter para o formato esperado
        loadedAssets = projectAssets.map(asset => {
            const fileName = asset.path.split('/').pop();
            const name = fileName.replace('.glb', '');
            return {
                name: name,
                path: asset.path,
                fileType: 'glb',
                category: asset.category,
                size: 'Unknown' // Será obtido quando necessário
            };
        });

        console.log(`✅ ${loadedAssets.length} modelos 3D carregados do projeto`);
        updateAssetsBrowser();
    }

    // Remover o input de seleção de pasta - agora carrega automaticamente
    // document.getElementById('load-assets-folder').onchange = function(e) { ... }
    
    // Carregar assets automaticamente ao inicializar
    loadProjectAssets();

    // Função para atualizar o browser de objetos com categorias
    function updateAssetsBrowser() {
        if (loadedAssets.length === 0) {
            assetsBrowserEl.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">Nenhum modelo 3D encontrado no projeto</div>';
            return;
        }

        // Agrupar assets por categoria
        const categorizedAssets = {};
        loadedAssets.forEach(asset => {
            const category = asset.category || 'Uncategorized';
            if (!categorizedAssets[category]) {
                categorizedAssets[category] = [];
            }
            categorizedAssets[category].push(asset);
        });

        // Cores para cada categoria
        const categoryColors = {
            'Buildings': '#8B4513',
            'Nature': '#228B22',
            'Infrastructure': '#696969',
            'Decorations': '#FF6347',
            'Structures': '#4682B4',
            'Lighting': '#FFD700',
            'Vehicles': '#800080',
            'Props': '#FF8C00',
            'Uncategorized': '#7f8c8d'
        };

        let html = `<div style="margin-bottom: 10px; font-weight: bold; color: #333;">
            📦 Modelos do Projeto (${loadedAssets.length} itens)
        </div>`;

        // Criar seções por categoria
        Object.keys(categorizedAssets).sort().forEach(category => {
            const assets = categorizedAssets[category];
            const categoryColor = categoryColors[category] || '#7f8c8d';
            
            html += `<div class="category-section" style="margin-bottom: 15px;">
                <h4 style="color: ${categoryColor}; margin: 5px 0; font-size: 0.9em; border-bottom: 1px solid ${categoryColor};">
                    ${category} (${assets.length})
                </h4>
                <div class="category-items" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px;">
            `;
            
            assets.forEach((asset, index) => {
                const globalIndex = loadedAssets.indexOf(asset);
                html += `
                    <div class="asset-item" onclick="loadProjectAsset(${globalIndex})" title="Clique para adicionar '${asset.name}' à cena">
                        <div class="asset-preview" style="background: linear-gradient(45deg, ${categoryColor}, #2c3e50); height: 60px; border-radius: 4px; margin-bottom: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.7em;">
                            GLB
                        </div>
                        <div style="font-size: 0.75em; text-align: center; word-wrap: break-word;">
                            ${asset.name.length > 15 ? asset.name.substring(0, 12) + '...' : asset.name}
                        </div>
                        <div style="font-size: 0.6em; color: #888; text-align: center;">
                            ${asset.fileType.toUpperCase()}
                        </div>
                    </div>
                `;
            });
            
            html += '</div></div>';
        });
        
        assetsBrowserEl.innerHTML = html;
    }

    // Função para processar carregamento bem-sucedido
    function handleSuccessfulLoad(result, asset, assetItem, urlToRevoke) {
        const meshes = result.meshes;
        try {
            console.log(`Meshes carregados: ${meshes.length} para ${asset.name}`);
            
            if (meshes.length > 0) {
                // Criar material padrão para meshes sem material válido
                const defaultMaterial = new BABYLON.StandardMaterial(`default_${asset.name}`, scene);
                defaultMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
                defaultMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                
                // Criar um parent mesh para agrupar todos os meshes importados
                const parentMesh = new BABYLON.TransformNode(`imported_${asset.name}_${objectList.length}`, scene);
                
                // Filtrar meshes válidos e anexar ao parent
                const validMeshes = meshes.filter(mesh => mesh.name !== "__root__");
                validMeshes.forEach(mesh => {
                    if (mesh.parent === null) {
                        mesh.setParent(parentMesh);
                    }
                    
                    // Verificar se o material está quebrado e aplicar material padrão
                    if (!mesh.material || mesh.material.needAlphaBlending === undefined) {
                        mesh.material = defaultMaterial.clone(`material_${mesh.name}`);
                        console.log(`Material padrão aplicado ao mesh: ${mesh.name}`);
                    }
                });

                // Posicionar o objeto
                parentMesh.position = new BABYLON.Vector3(0, 1, 0);
                
                // Ajustar escala se necessário
                const meshesWithBounds = validMeshes.filter(m => m.getBoundingInfo);
                if (meshesWithBounds.length > 0) {
                    try {
                        const boundingInfo = meshesWithBounds[0].getBoundingInfo();
                        const size = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);
                        const maxSize = Math.max(size.x, size.y, size.z);
                        if (maxSize > 3) {
                            const scale = 2 / maxSize;
                            parentMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
                            console.log(`Objeto redimensionado para escala: ${scale.toFixed(2)}`);
                        }
                    } catch (scaleError) {
                        console.warn('Não foi possível calcular escala:', scaleError);
                    }
                }

                // Adicionar à lista de objetos
                objectList.push({
                    name: parentMesh.name,
                    mesh: parentMesh,
                    type: `Imported ${asset.fileType.toUpperCase()}`,
                    selected: false,
                    props: { movel: false, perigo: false, plataforma: false, decorativo: true },
                    originalMeshes: validMeshes,
                    assetName: asset.name
                });

                updateObjectList();
                console.log(`✅ Objeto 3D "${asset.name}" (${asset.fileType.toUpperCase()}) adicionado à cena com sucesso`);
            } else {
                throw new Error('Nenhum mesh válido encontrado no arquivo');
            }
        } catch (error) {
            console.error('Erro ao processar meshes:', error);
            alert(`Erro ao processar o objeto 3D: ${asset.name}\nDetalhes: ${error.message}`);
        } finally {
            if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
            assetItem.classList.remove('loading');
        }
    }

    // Função para carregar asset do projeto via fetch
    window.loadProjectAsset = function(assetIndex) {
        const asset = loadedAssets[assetIndex];
        if (!asset) {
            console.error('Asset não encontrado:', assetIndex);
            return;
        }

        console.log(`🔄 Carregando asset GLB do projeto: ${asset.name} (${asset.path})`);
        
        // Mostrar loading visual
        const assetItems = document.querySelectorAll('.asset-item');
        const assetItem = assetItems[assetIndex];
        if (assetItem) {
            assetItem.style.opacity = '0.5';
            assetItem.style.pointerEvents = 'none';
        }

        // Carregar GLB diretamente - sem necessidade de interceptações
        BABYLON.SceneLoader.ImportMeshAsync("", asset.path, "", scene).then(function(result) {
            
            const meshes = result.meshes;
            console.log(`✅ Meshes GLB carregados: ${meshes.length} para ${asset.name}`);
            
            if (meshes.length > 0) {
                // Criar parent node para agrupar meshes
                const parentMesh = new BABYLON.TransformNode(`imported_${asset.name}_${objectList.length}`, scene);
                
                // Filtrar e anexar meshes válidos (GLB já vem com materiais corretos)
                const validMeshes = meshes.filter(mesh => mesh.name !== "__root__");
                validMeshes.forEach(mesh => {
                    if (mesh.parent === null) {
                        mesh.setParent(parentMesh);
                    }
                });

                // Posicionar objeto
                parentMesh.position = new BABYLON.Vector3(0, 1, 0);
                
                // Ajustar escala se muito grande
                const meshesWithBounds = validMeshes.filter(m => m.getBoundingInfo);
                if (meshesWithBounds.length > 0) {
                    try {
                        const boundingInfo = meshesWithBounds[0].getBoundingInfo();
                        const size = boundingInfo.boundingBox.maximum.subtract(boundingInfo.boundingBox.minimum);
                        const maxSize = Math.max(size.x, size.y, size.z);
                        if (maxSize > 3) {
                            const scale = 2 / maxSize;
                            parentMesh.scaling = new BABYLON.Vector3(scale, scale, scale);
                        }
                    } catch (scaleError) {
                        console.warn('Não foi possível calcular escala:', scaleError);
                    }
                }

                // Adicionar à lista de objetos
                objectList.push({
                    name: parentMesh.name,
                    mesh: parentMesh,
                    type: `${asset.category} (GLB)`,
                    selected: false,
                    props: { movel: false, perigo: false, plataforma: false, decorativo: true },
                    originalMeshes: validMeshes,
                    assetName: asset.name,
                    assetCategory: asset.category
                });

                updateObjectList();
                console.log(`✅ "${asset.name}" (GLB) adicionado à cena com sucesso!`);
            } else {
                throw new Error('Nenhum mesh válido encontrado no arquivo GLB');
            }
        }).catch(function(error) {
            console.error(`❌ Erro ao carregar GLB ${asset.name}:`, error);
            alert(`Erro ao carregar "${asset.name}":\n${error.message}`);
        }).finally(function() {
            // Restaurar visual do item
            if (assetItem) {
                assetItem.style.opacity = '1';
                assetItem.style.pointerEvents = 'auto';
            }
        });
    };

    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (selectedIdx !== null && objectList[selectedIdx]) {
                const obj = objectList[selectedIdx];
                obj.selected = false;
                
                // Remover emissive
                if (obj.originalMeshes) {
                    obj.originalMeshes.forEach(mesh => {
                        if (mesh.material) {
                            mesh.material.emissiveColor = BABYLON.Color3.Black();
                        }
                    });
                } else if (obj.mesh.material) {
                    obj.mesh.material.emissiveColor = BABYLON.Color3.Black();
                }
            }
            selectedIdx = null;
            updateObjectList();
            updateBottomBar();
            if (gizmoManager) gizmoManager.attachToMesh(null);
        }
        
        // Deletar objeto com Delete ou Backspace
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdx !== null && objectList[selectedIdx]) {
            deleteSelectedObject();
        }
    });

    // Função para deletar objeto selecionado
    function deleteSelectedObject() {
        if (selectedIdx === null || !objectList[selectedIdx]) return;
        
        const obj = objectList[selectedIdx];
        
        // Não permitir deletar o ground
        if (obj.name === 'ground') {
            alert('Não é possível deletar o chão!');
            return;
        }
        
        if (confirm(`Tem certeza que deseja deletar "${obj.name}"?`)) {
            // Dispose do mesh e meshes filhos
            if (obj.originalMeshes) {
                obj.originalMeshes.forEach(mesh => mesh.dispose());
            }
            if (obj.mesh) {
                obj.mesh.dispose();
            }
            
            // Remover da lista
            objectList.splice(selectedIdx, 1);
            selectedIdx = null;
            
            // Atualizar UI
            updateObjectList();
            updateBottomBar();
            if (gizmoManager) gizmoManager.attachToMesh(null);
        }
    }

    // Botão de deletar
    document.getElementById('delete-object').onclick = deleteSelectedObject;

    // Atualizar renderização
    engine.runRenderLoop(function() {
        scene.render();
    });
    window.addEventListener('resize', function() {
        engine.resize();
    });

    // Inicializar UI
    updateObjectList();
});
