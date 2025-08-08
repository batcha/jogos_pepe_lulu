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
        if (selectedIdx === null || !objectList[selectedIdx]) {
            colorInput.value = '#888888';
            sizeInput.value = '';
            posX.value = posY.value = posZ.value = '';
            rotX.value = rotY.value = rotZ.value = '';
            propValue.checked = false;
            return;
        }
        const obj = objectList[selectedIdx];
        // Cor
        if (obj.mesh.material && obj.mesh.material.diffuseColor) {
            const c = obj.mesh.material.diffuseColor;
            colorInput.value = '#' + ((1 << 24) + (Math.round(c.r * 255) << 16) + (Math.round(c.g * 255) << 8) + Math.round(c.b * 255)).toString(16).slice(1);
        }
        // Tamanho
        if (obj.type === 'plane') {
            sizeInput.value = obj.mesh.scaling.x;
        } else {
            sizeInput.value = obj.mesh.scaling.x;
        }
        // Posição
        posX.value = obj.mesh.position.x;
        posY.value = obj.mesh.position.y;
        posZ.value = obj.mesh.position.z;
        // Rotação
        rotX.value = obj.mesh.rotation.x;
        rotY.value = obj.mesh.rotation.y;
        rotZ.value = obj.mesh.rotation.z;
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
                obj.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
            } else {
                obj.mesh.material.emissiveColor = BABYLON.Color3.Black();
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
        obj.mesh.material.diffuseColor = new BABYLON.Color3(r,g,b);
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

    // Seleção de objeto
    function selectObject(idx) {
        objectList.forEach((obj, i) => {
            obj.selected = (i === idx);
            if (obj.selected) {
                obj.mesh.material.emissiveColor = new BABYLON.Color3(1, 0.7, 0.2);
            } else {
                obj.mesh.material.emissiveColor = BABYLON.Color3.Black();
            }
        });
        selectedIdx = idx;
        updateObjectList();
        if (gizmoManager) {
            if (idx !== null && objectList[idx]) {
                gizmoManager.attachToMesh(objectList[idx].mesh);
                updateGizmoMode(gizmoMode);
            } else {
                gizmoManager.attachToMesh(null);
            }
        }
    }

    // Adição de objetos
    document.getElementById('add-cube').onclick = function() {
        var box = BABYLON.MeshBuilder.CreateBox('cube_' + objectList.length, { size: 2 }, scene);
        box.position.y = 1;
        var mat = new BABYLON.StandardMaterial('mat', scene);
        mat.diffuseColor = new BABYLON.Color3(0.4, 0.8, 0.3);
        box.material = mat;
        objectList.push({ name: box.name, mesh: box, type: 'Cubo', selected: false });
        updateObjectList();
    };
    document.getElementById('add-sphere').onclick = function() {
        var sphere = BABYLON.MeshBuilder.CreateSphere('sphere_' + objectList.length, { diameter: 2 }, scene);
        sphere.position.y = 1;
        var mat = new BABYLON.StandardMaterial('mat', scene);
        mat.diffuseColor = new BABYLON.Color3(0.7, 0.5, 0.9);
        sphere.material = mat;
        objectList.push({ name: sphere.name, mesh: sphere, type: 'Esfera', selected: false });
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
                var idx = objectList.findIndex(obj => obj.mesh === pickResult.pickedMesh);
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
            props: obj.props || {}
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

    // Deselecionar objeto com ESC
    window.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (selectedIdx !== null && objectList[selectedIdx]) {
                objectList[selectedIdx].selected = false;
                objectList[selectedIdx].mesh.material.emissiveColor = BABYLON.Color3.Black();
            }
            selectedIdx = null;
            updateObjectList();
            if (gizmoManager) gizmoManager.attachToMesh(null);
        }
    });

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
