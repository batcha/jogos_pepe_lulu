// Inicialização principal do editor 3D
window.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById('renderCanvas');
    var engine = new BABYLON.Engine(canvas, true);
    var objectList = [];
    var objectListEl = document.getElementById('object-list');
    var selectedIndices = []; // Array de índices selecionados (seleção múltipla)
    var selectedIdx = null; // Mantém compatibilidade, mas será o último selecionado
    var gizmoManager = null;
    var gizmoMode = 'move';
    var isMultiSelectMode = false;
    var selectionSets = {}; // Sets de seleção salvos
    var layerVisibility = {}; // Controle de visibilidade por layer
    var objectGroups = []; // Grupos de objetos
    var searchFilter = ''; // Filtro de busca
    var keyPressed = {}; // Controle de teclas pressionadas
    var transformMode = null; // 'move', 'rotate', 'scale'
    var axisLock = null; // 'x', 'y', 'z'
    
    // FASE 2: Variáveis para ferramentas de precisão
    var gridEnabled = true;
    var gridSize = 1.0;
    var snapEnabled = false;
    var snapToGrid = true;
    var snapToObjects = false;
    var measurementMode = false;
    var measurementStart = null;
    var measurementLine = null;
    var alignMode = false;
    var viewportMode = 'perspective'; // perspective, top, front, side
    var wireframeMode = false;
    
    // Grid helper mesh
    var gridHelper = null;

    // FASE 2: Interface Avançada
    var cameraBookmarks = [];
    var currentContextMenuTarget = null;
    var propertiesPanelVisible = false;

    // FASE 2: Criação Avançada
    var arrayToolSettings = {
        count: 3,
        spacingX: 2,
        spacingY: 0,
        spacingZ: 0
    };
    var mirrorToolSettings = {
        axis: 'x',
        removeOriginal: false
    };

    // Função para atualizar campos da bottom bar
    function updateBottomBar() {
        const selectedEl = document.getElementById('selected-count');
        const objsEl = document.getElementById('objects-count');
        const modeEl = document.getElementById('gizmo-mode');
        
        if (selectedEl) selectedEl.textContent = selectedIndices.length;
        if (objsEl) objsEl.textContent = objectList.length;
        if (modeEl) modeEl.textContent = gizmoMode === 'move' ? 'Move' : 
                                      gizmoMode === 'rotate' ? 'Rotate' : 'Scale';
        
        // Mostrar propriedades do objeto selecionado
        updateObjectProperties();
    }
    
    // Função para atualizar propriedades do objeto selecionado
    function updateObjectProperties() {
        const propertiesPanel = document.getElementById('object-properties-panel');
        if (!propertiesPanel) return;
        
        if (selectedIndices.length === 1) {
            const obj = objectList[selectedIndices[0]];
            if (obj) {
                // Obter transformações atuais do mesh
                const mesh = obj.mesh;
                const pos = mesh.position;
                const rot = mesh.rotation;
                const scale = mesh.scaling;
                
                // Verificar se é primitivo para mostrar seleção de cor
                const isPrimitive = ['cube', 'sphere', 'plane'].includes(obj.type);
                
                let colorSection = '';
                if (isPrimitive) {
                    const currentColor = mesh.material && mesh.material.diffuseColor ? 
                        `#${Math.round(mesh.material.diffuseColor.r * 255).toString(16).padStart(2, '0')}${Math.round(mesh.material.diffuseColor.g * 255).toString(16).padStart(2, '0')}${Math.round(mesh.material.diffuseColor.b * 255).toString(16).padStart(2, '0')}` : '#ffffff';
                    
                    colorSection = `
                        <div style="margin-bottom:6px;">
                            <label style="color:#E91E63;display:block;font-size:0.9em;">Cor:</label>
                            <input type="color" value="${currentColor}" 
                                   onchange="updateObjectColor(${selectedIndices[0]}, this.value)"
                                   style="width:60px;height:30px;border:1px solid #555;background:#333;cursor:pointer;">
                        </div>
                    `;
                }
                
                propertiesPanel.innerHTML = `
                    <div style="padding:8px;color:white;height:100%;overflow-y:auto;">
                        <h4 style="margin:0 0 10px 0;color:#4CAF50;font-size:0.95rem;">🎯 Propriedades do Objeto</h4>
                        
                        <!-- Nome -->
                        <div style="margin-bottom:8px;">
                            <label style="color:#fff;display:block;font-size:0.85em;margin-bottom:2px;">Nome:</label>
                            <input type="text" value="${obj.name}" onchange="renameObject(${selectedIndices[0]}, this.value)" 
                                   style="width:100%;padding:4px;background:#333;color:white;border:1px solid #555;border-radius:3px;font-size:0.8em;">
                        </div>
                        
                        <!-- Tipo e Layer em linha -->
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
                            <div>
                                <label style="color:#64B5F6;display:block;font-size:0.85em;margin-bottom:2px;">Tipo:</label>
                                <span style="color:#64B5F6;font-size:0.8em;background:#333;padding:4px 8px;border-radius:3px;display:block;text-align:center;">${obj.type}</span>
                            </div>
                            <div>
                                <label style="color:#fff;display:block;font-size:0.85em;margin-bottom:2px;">Layer:</label>
                                <select onchange="setObjectLayer(${selectedIndices[0]}, this.value)" 
                                        style="width:100%;padding:4px;background:#333;color:white;border:1px solid #555;border-radius:3px;font-size:0.8em;">
                                    <option value="geometry" ${obj.layer === 'geometry' ? 'selected' : ''}>Geometry</option>
                                    <option value="imported" ${obj.layer === 'imported' ? 'selected' : ''}>Imported</option>
                                    <option value="special" ${obj.layer === 'special' ? 'selected' : ''}>Special</option>
                                </select>
                            </div>
                        </div>
                        
                        ${colorSection}
                        
                        <!-- Transform em grid compacto -->
                        <div style="margin-bottom:8px;">
                            <h5 style="margin:5px 0;color:#FF9800;font-size:0.9em;">🎛️ Transform:</h5>
                            
                            <!-- Posição -->
                            <div style="margin-bottom:4px;">
                                <label style="color:#4CAF50;display:block;font-size:0.8em;margin-bottom:1px;">Posição (X, Y, Z):</label>
                                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">
                                    <input type="number" step="0.1" value="${pos.x.toFixed(2)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'position', 'x', parseFloat(this.value))"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                    <input type="number" step="0.1" value="${pos.y.toFixed(2)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'position', 'y', parseFloat(this.value))"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                    <input type="number" step="0.1" value="${pos.z.toFixed(2)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'position', 'z', parseFloat(this.value))"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                </div>
                            </div>
                            
                            <!-- Rotação -->
                            <div style="margin-bottom:4px;">
                                <label style="color:#2196F3;display:block;font-size:0.8em;margin-bottom:1px;">Rotação (X, Y, Z) graus:</label>
                                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">
                                    <input type="number" step="1" value="${(rot.x * 180 / Math.PI).toFixed(1)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'rotation', 'x', this.value * Math.PI / 180)"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                    <input type="number" step="1" value="${(rot.y * 180 / Math.PI).toFixed(1)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'rotation', 'y', this.value * Math.PI / 180)"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                    <input type="number" step="1" value="${(rot.z * 180 / Math.PI).toFixed(1)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'rotation', 'z', this.value * Math.PI / 180)"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                </div>
                            </div>
                            
                            <!-- Escala -->
                            <div style="margin-bottom:4px;">
                                <label style="color:#FF5722;display:block;font-size:0.8em;margin-bottom:1px;">Escala (X, Y, Z):</label>
                                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">
                                    <input type="number" step="0.1" value="${scale.x.toFixed(2)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'scaling', 'x', parseFloat(this.value))"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                    <input type="number" step="0.1" value="${scale.y.toFixed(2)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'scaling', 'y', parseFloat(this.value))"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                    <input type="number" step="0.1" value="${scale.z.toFixed(2)}" 
                                           onchange="updateObjectTransform(${selectedIndices[0]}, 'scaling', 'z', parseFloat(this.value))"
                                           style="padding:3px;background:#333;color:white;border:1px solid #555;text-align:center;font-size:0.75em;border-radius:2px;">
                                </div>
                            </div>
                        </div>
                        
                        <!-- Propriedades do Jogo -->
                        <div style="margin-bottom:4px;">
                            <h5 style="margin:5px 0;color:#FF9800;font-size:0.9em;">🎮 Propriedades do Jogo:</h5>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:0.8em;">
                                <label><input type="checkbox" ${obj.props?.movel ? 'checked' : ''} onchange="updateObjectProp(${selectedIndices[0]}, 'movel', this.checked)"> Móvel</label>
                                <label><input type="checkbox" ${obj.props?.perigo ? 'checked' : ''} onchange="updateObjectProp(${selectedIndices[0]}, 'perigo', this.checked)"> Perigo</label>
                                <label><input type="checkbox" ${obj.props?.plataforma ? 'checked' : ''} onchange="updateObjectProp(${selectedIndices[0]}, 'plataforma', this.checked)"> Plataforma</label>
                                <label><input type="checkbox" ${obj.props?.decorativo ? 'checked' : ''} onchange="updateObjectProp(${selectedIndices[0]}, 'decorativo', this.checked)"> Decorativo</label>
                            </div>
                        </div>
                        
                        ${obj.assetPath ? `<div style="margin-bottom:4px;font-size:0.8em;"><label>📁 Asset: <span style="color:#9C27B0;">${obj.assetPath}</span></label></div>` : ''}
                    </div>
                `;
            }
        } else if (selectedIndices.length > 1) {
            propertiesPanel.innerHTML = `
                <div style="padding:8px;color:white;text-align:center;">
                    <h4 style="margin:0 0 8px 0;color:#4CAF50;font-size:0.95rem;">👥 Múltiplos Objetos (${selectedIndices.length})</h4>
                    <p style="margin:5px 0;font-size:0.8rem;color:#ccc;">Edição em lote disponível</p>
                    <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
                        <button onclick="resetSelectedTransforms()" style="padding:6px 12px;background:#FF5722;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">🔄 Reset Transforms</button>
                        <button onclick="deleteSelectedObjects()" style="padding:6px 12px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.8rem;">🗑️ Deletar Selecionados</button>
                    </div>
                </div>
            `;
        } else {
            propertiesPanel.innerHTML = `
                <div style="padding:8px;color:white;text-align:center;">
                    <h4 style="margin:0;color:#666;font-size:0.95rem;">Nenhum objeto selecionado</h4>
                    <p style="margin:5px 0;font-size:0.8rem;color:#888;">Clique em um objeto para editar propriedades</p>
                </div>
            `;
        }
    }
    
    // Função para renomear objeto
    function renameObject(index, newName) {
        if (objectList[index] && newName.trim()) {
            objectList[index].name = newName.trim();
            updateObjectList();
            updateObjectProperties();
        }
    }
    
    // Função para atualizar propriedade do objeto
    function updateObjectProp(index, prop, value) {
        if (objectList[index]) {
            if (!objectList[index].props) objectList[index].props = {};
            objectList[index].props[prop] = value;
            updateObjectList();
        }
    }
    
    // Função para atualizar transformações do objeto
    function updateObjectTransform(index, transformType, axis, value) {
        if (objectList[index] && objectList[index].mesh) {
            const mesh = objectList[index].mesh;
            
            if (transformType === 'position') {
                mesh.position[axis] = value;
            } else if (transformType === 'rotation') {
                mesh.rotation[axis] = value;
            } else if (transformType === 'scaling') {
                mesh.scaling[axis] = value;
            }
            
            // Atualizar dados armazenados do objeto
            objectList[index][transformType] = mesh[transformType].clone();
            
            // Refresh do gizmo se o objeto estiver selecionado
            if (selectedIndices.includes(index)) {
                updateGizmoSelection();
            }
        }
    }
    
    // Função para resetar transformações de objetos selecionados
    function resetSelectedTransforms() {
        if (confirm('Resetar transformações dos objetos selecionados?')) {
            selectedIndices.forEach(index => {
                if (objectList[index] && objectList[index].mesh) {
                    const mesh = objectList[index].mesh;
                    mesh.position.set(0, 0, 0);
                    mesh.rotation.set(0, 0, 0);
                    mesh.scaling.set(1, 1, 1);
                    
                    // Atualizar dados armazenados
                    objectList[index].position = mesh.position.clone();
                    objectList[index].rotation = mesh.rotation.clone();
                    objectList[index].scale = mesh.scaling.clone();
                }
            });
            updateObjectProperties();
            updateGizmoSelection();
        }
    }
    
    // Função para atualizar cor do objeto (apenas primitivos)
    function updateObjectColor(index, colorHex) {
        if (objectList[index] && objectList[index].mesh) {
            const mesh = objectList[index].mesh;
            
            // Converter hex para RGB
            const r = parseInt(colorHex.slice(1, 3), 16) / 255;
            const g = parseInt(colorHex.slice(3, 5), 16) / 255;
            const b = parseInt(colorHex.slice(5, 7), 16) / 255;
            
            // Criar material se não existir
            if (!mesh.material) {
                mesh.material = new BABYLON.StandardMaterial(`material_${mesh.name}`, scene);
            }
            
            // Atualizar cor
            mesh.material.diffuseColor = new BABYLON.Color3(r, g, b);
        }
    }
    
    // Função para deletar objetos selecionados
    function deleteSelectedObjects() {
        if (selectedIndices.length === 0) return;
        
        if (confirm(`Deletar ${selectedIndices.length} objeto(s) selecionado(s)?`)) {
            // Ordenar índices de forma decrescente para deletar corretamente
            const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
            
            sortedIndices.forEach(index => {
                if (objectList[index]) {
                    // Remover mesh da cena
                    if (objectList[index].mesh) {
                        objectList[index].mesh.dispose();
                    }
                    // Remover da lista
                    objectList.splice(index, 1);
                }
            });
            
            // Limpar seleção
            clearSelection();
            updateObjectList();
            updateBottomBar();
        }
    }

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
            selected: false,
            visible: true,
            locked: true, // Ground começa bloqueado
            layer: 'geometry'
        });

    // Gizmo Manager
    gizmoManager = new BABYLON.GizmoManager(scene);
    updateGizmoMode(gizmoMode);
    
    // FASE 2: Criar grid visual
    createGridHelper();

    // Função para atualizar lista lateral com outliner avançado
    function updateObjectList() {
        if (!objectListEl) return;
        
        objectListEl.innerHTML = '';
        
        // Filtrar objetos baseado na busca
        const filteredObjects = objectList.map((obj, idx) => ({obj, idx}))
            .filter(({obj}) => 
                searchFilter === '' || 
                obj.name.toLowerCase().includes(searchFilter) ||
                obj.type.toLowerCase().includes(searchFilter)
            );
        
        // Renderizar grupos primeiro
        objectGroups.forEach(group => {
            const groupDiv = document.createElement('div');
            groupDiv.style.cssText = 'margin:4px 0;padding:4px;background:#2a2a3a;border-radius:4px;border-left:3px solid #3a7bd5;';
            
            const groupHeader = document.createElement('div');
            groupHeader.style.cssText = 'display:flex;align-items:center;cursor:pointer;font-weight:bold;';
            groupHeader.innerHTML = `
                <span style="margin-right:8px;">${group.visible ? '👁️' : '🙈'}</span>
                <span style="margin-right:8px;">${group.locked ? '🔒' : '🔓'}</span>
                <span style="flex:1;">${group.name} (${group.objects.length})</span>
                <button style="background:none;border:none;color:#ff6b6b;cursor:pointer;">✖</button>
            `;
            
            groupHeader.onclick = function(e) {
                if (e.target.tagName === 'BUTTON') {
                    deleteGroup(group.name);
                    return;
                }
                toggleGroupVisibility(group.name);
            };
            
            groupDiv.appendChild(groupHeader);
            objectListEl.appendChild(groupDiv);
        });
        
        // Renderizar objetos filtrados
        filteredObjects.forEach(({obj, idx}) => {
            if (obj.groupName) return; // Objeto está em grupo, não renderizar separadamente
            
            const li = document.createElement('li');
            li.style.cssText = 'margin:2px 0;padding:6px 8px;border-radius:4px;cursor:pointer;display:flex;align-items:center;gap:8px;';
            li.className = selectedIndices.includes(idx) ? 'selected' : '';
            
            // Ícone baseado no tipo
            const typeIcon = obj.type === 'Cubo' ? '🟦' : 
                           obj.type === 'Esfera' ? '🔴' : 
                           obj.type === 'Cilindro' ? '🟢' : 
                           obj.type === 'GLB' ? '🎯' : '📦';
            
            li.innerHTML = `
                <span style="margin-right:4px;">${obj.visible ? '👁️' : '🙈'}</span>
                <span style="margin-right:4px;">${obj.locked ? '🔒' : '🔓'}</span>
                <span style="margin-right:6px;">${typeIcon}</span>
                <span style="flex:1;">${obj.name}</span>
                <small style="color:#888;font-size:0.8em;">${obj.layer || 'default'}</small>
            `;
            
            li.onclick = function(e) {
                // Controle de multi-seleção
                if (e.ctrlKey) {
                    toggleSelection(idx);
                } else if (e.shiftKey && selectedIndices.length > 0) {
                    // Seleção em range
                    const lastIdx = selectedIndices[selectedIndices.length - 1];
                    const start = Math.min(lastIdx, idx);
                    const end = Math.max(lastIdx, idx);
                    selectedIndices = [];
                    for (let i = start; i <= end; i++) {
                        if (!selectedIndices.includes(i)) {
                            selectedIndices.push(i);
                        }
                    }
                    selectedIdx = idx;
                    updateObjectList();
                    updateGizmoSelection();
                } else {
                    selectObject(idx);
                }
                updateBottomBar();
            };
            
            objectListEl.appendChild(li);
        });
    }

    // Adição de objetos
    const addCubeBtn = document.getElementById('add-cube');
    if (addCubeBtn) {
        addCubeBtn.onclick = function() {
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
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });
            updateObjectList();
        };
    }

    const addSphereBtn = document.getElementById('add-sphere');
    if (addSphereBtn) {
        addSphereBtn.onclick = function() {
            var sphere = BABYLON.MeshBuilder.CreateSphere('sphere_' + objectList.length, { diameter: 2 }, scene);
            sphere.position.y = 1;
            var mat = new BABYLON.StandardMaterial('mat', scene);
            mat.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0.7);
            sphere.material = mat;
            objectList.push({ 
                name: sphere.name, 
                mesh: sphere, 
                type: 'Esfera', 
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });
            updateObjectList();
        };
    }

    // FASE 2: Criação Avançada - Novos Primitivos
    const addCylinderBtn = document.getElementById('add-cylinder');
    if (addCylinderBtn) {
        addCylinderBtn.onclick = function() {
            var cylinder = BABYLON.MeshBuilder.CreateCylinder('cylinder_' + objectList.length, { 
                diameter: 2, 
                height: 3 
            }, scene);
            cylinder.position.y = 1.5;
            var mat = new BABYLON.StandardMaterial('mat', scene);
            mat.diffuseColor = new BABYLON.Color3(0.8, 0.5, 0.2);
            cylinder.material = mat;
            objectList.push({ 
                name: cylinder.name, 
                mesh: cylinder, 
                type: 'Cilindro', 
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });
            updateObjectList();
            showToast('Cilindro criado!', 'success');
        };
    }

    const addConeBtn = document.getElementById('add-cone');
    if (addConeBtn) {
        addConeBtn.onclick = function() {
            var cone = BABYLON.MeshBuilder.CreateCylinder('cone_' + objectList.length, { 
                diameterTop: 0, 
                diameterBottom: 2, 
                height: 3 
            }, scene);
            cone.position.y = 1.5;
            var mat = new BABYLON.StandardMaterial('mat', scene);
            mat.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.5);
            cone.material = mat;
            objectList.push({ 
                name: cone.name, 
                mesh: cone, 
                type: 'Cone', 
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });
            updateObjectList();
            showToast('Cone criado!', 'success');
        };
    }

    const addTorusBtn = document.getElementById('add-torus');
    if (addTorusBtn) {
        addTorusBtn.onclick = function() {
            var torus = BABYLON.MeshBuilder.CreateTorus('torus_' + objectList.length, { 
                diameter: 3, 
                thickness: 0.5 
            }, scene);
            torus.position.y = 1.5;
            var mat = new BABYLON.StandardMaterial('mat', scene);
            mat.diffuseColor = new BABYLON.Color3(0.6, 0.8, 0.4);
            torus.material = mat;
            objectList.push({ 
                name: torus.name, 
                mesh: torus, 
                type: 'Torus', 
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });
            updateObjectList();
            showToast('Torus criado!', 'success');
        };
    }

    const addStairsBtn = document.getElementById('add-stairs');
    if (addStairsBtn) {
        addStairsBtn.onclick = function() {
            // Criar escada como grupo de cubos
            var stairGroup = new BABYLON.TransformNode('stairs_' + objectList.length, scene);
            stairGroup.position.y = 0;
            
            var mat = new BABYLON.StandardMaterial('stairMat', scene);
            mat.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.5);
            
            // Criar 5 degraus
            for (let i = 0; i < 5; i++) {
                var step = BABYLON.MeshBuilder.CreateBox('step_' + i, { 
                    width: 2, 
                    height: 0.2, 
                    depth: 0.4 
                }, scene);
                step.position.x = 0;
                step.position.y = i * 0.2 + 0.1;
                step.position.z = i * 0.4;
                step.material = mat;
                step.parent = stairGroup;
            }
            
            objectList.push({ 
                name: stairGroup.name, 
                mesh: stairGroup, 
                type: 'Escadas', 
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: true, decorativo: false }
            });
            updateObjectList();
            showToast('Escadas criadas!', 'success');
        };
    }

    // Sistema de seleção múltipla
    function selectObject(index) {
        // Limpar seleção anterior
        clearSelection();
        
        // Selecionar novo objeto
        selectedIndices = [index];
        selectedIdx = index;
        
        // Atualizar visual
        updateObjectList();
        updateGizmoSelection();
        updateBottomBar();
    }

    function toggleSelection(index) {
        const idx = selectedIndices.indexOf(index);
        if (idx > -1) {
            selectedIndices.splice(idx, 1);
        } else {
            selectedIndices.push(index);
        }
        selectedIdx = selectedIndices[selectedIndices.length - 1] || null;
        
        updateObjectList();
        updateGizmoSelection();
        updateBottomBar();
    }

    function clearSelection() {
        selectedIndices = [];
        selectedIdx = null;
        updateObjectList();
        updateGizmoSelection();
        updateBottomBar();
    }

    function updateGizmoSelection() {
        if (gizmoManager) {
            if (selectedIndices.length === 1) {
                const obj = objectList[selectedIndices[0]];
                if (obj && obj.mesh && !obj.locked) {
                    gizmoManager.attachToMesh(obj.mesh);
                    
                    // Garantir que os observadores estão configurados
                    setupGizmoObservers();
                } else {
                    gizmoManager.attachToMesh(null);
                }
            } else {
                gizmoManager.attachToMesh(null);
            }
        }
        
        // Atualizar cores de seleção
        objectList.forEach((obj, idx) => {
            if (obj.mesh && obj.mesh.material) {
                if (selectedIndices.includes(idx)) {
                    // Destacar objeto selecionado
                    obj.mesh.material.emissiveColor = new BABYLON.Color3(0.2, 0.5, 1);
                } else {
                    // Resetar cor
                    obj.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                }
            }
        });
    }
    
    // Função para configurar observadores do gizmo (chamada sob demanda)
    function setupGizmoObservers() {
        // Só configurar se ainda não foi configurado
        if (gizmoManager._observersSetup) return;
        
        try {
            if (gizmoManager.gizmos.positionGizmo && !gizmoManager.gizmos.positionGizmo._observerSetup) {
                gizmoManager.gizmos.positionGizmo.onDragEndObservable.add(() => {
                    // FASE 2: Aplicar snap após movimentação
                    if (snapEnabled && selectedIndices.length === 1) {
                        const obj = objectList[selectedIndices[0]];
                        if (obj && obj.mesh) {
                            const snappedPos = applySnap(obj.mesh.position);
                            obj.mesh.position.copyFrom(snappedPos);
                        }
                    }
                    updateObjectProperties();
                });
                gizmoManager.gizmos.positionGizmo._observerSetup = true;
            }
            
            if (gizmoManager.gizmos.rotationGizmo && !gizmoManager.gizmos.rotationGizmo._observerSetup) {
                gizmoManager.gizmos.rotationGizmo.onDragEndObservable.add(() => {
                    updateObjectProperties();
                });
                gizmoManager.gizmos.rotationGizmo._observerSetup = true;
            }
            
            if (gizmoManager.gizmos.scaleGizmo && !gizmoManager.gizmos.scaleGizmo._observerSetup) {
                gizmoManager.gizmos.scaleGizmo.onDragEndObservable.add(() => {
                    updateObjectProperties();
                });
                gizmoManager.gizmos.scaleGizmo._observerSetup = true;
            }
            
            gizmoManager._observersSetup = true;
        } catch (error) {
            console.warn('Erro ao configurar observadores do gizmo:', error);
        }
    }

    // Clique na cena para desselecionar
    scene.onPointerObservable.add(function(pointerInfo) {
        if (pointerInfo.pickInfo.hit && pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            const pickedMesh = pointerInfo.pickInfo.pickedMesh;
            const pickedPoint = pointerInfo.pickInfo.pickedPoint;
            
            // FASE 2: Modo de medição tem prioridade
            if (measurementMode && pickedPoint) {
                if (!measurementStart) {
                    measurementStart = pickedPoint.clone();
                    console.log('Primeiro ponto de medição selecionado');
                } else {
                    createMeasurementLine(measurementStart, pickedPoint);
                    measurementMode = false;
                    measurementStart = null;
                    // Atualizar botão visual
                    const measureBtn = document.getElementById('measurement-tool');
                    if (measureBtn) measureBtn.style.background = '#34495e';
                }
                return;
            }
            
            if (pickedMesh) {
                console.log('Mesh clicada:', pickedMesh.name, 'ID:', pickedMesh.id);
                
                // Encontrar objeto na lista - verificar tanto o mesh principal quanto meshes filhas
                let objIndex = -1;
                let targetMesh = pickedMesh;
                
                // Se a mesh tem uma referência ao rootNode, usar ela
                if (pickedMesh.rootNodeParent) {
                    targetMesh = pickedMesh.rootNodeParent;
                    console.log('Usando rootNodeParent:', targetMesh.name);
                }
                
                // Primeiro, verificar se é o mesh principal
                objIndex = objectList.findIndex(obj => obj.mesh === targetMesh);
                
                // Se não encontrou, verificar se é uma mesh filha de um GLB
                if (objIndex === -1) {
                    objIndex = objectList.findIndex(obj => {
                        if (obj.childMeshes && obj.childMeshes.includes(pickedMesh)) {
                            return true;
                        }
                        // Verificar se a mesh pai é o TransformNode do objeto
                        if (pickedMesh.parent && obj.mesh === pickedMesh.parent) {
                            return true;
                        }
                        return false;
                    });
                }
                
                console.log('Objeto encontrado no índice:', objIndex);
                
                if (objIndex !== -1) {
                    if (keyPressed['Control']) {
                        toggleSelection(objIndex);
                    } else {
                        selectObject(objIndex);
                    }
                } else {
                    // Clique no vazio
                    if (!keyPressed['Control']) {
                        clearSelection();
                    }
                }
            } else {
                // Clique no vazio (sem mesh)
                if (!keyPressed['Control']) {
                    clearSelection();
                }
            }
        }
    });

    // Hotkeys avançados
    window.addEventListener('keydown', function(e) {
        keyPressed[e.key] = true;
        
        // Apenas processar se não estiver em input
        if (e.target.tagName === 'INPUT') return;
        
        // Seleção
        if (e.key === 'Escape') {
            clearSelection();
            transformMode = null;
            axisLock = null;
            e.preventDefault();
        }
        
        // Gizmos
        if (e.key === 'g' || e.key === 'G') {
            updateGizmoMode('move');
            transformMode = 'move';
            e.preventDefault();
        }
        if (e.key === 'r' || e.key === 'R') {
            updateGizmoMode('rotate');
            transformMode = 'rotate';
            e.preventDefault();
        }
        if (e.key === 's' || e.key === 'S') {
            updateGizmoMode('scale');
            transformMode = 'scale';
            e.preventDefault();
        }
        
        // Bloqueio de eixo
        if (transformMode) {
            if (e.key === 'x' || e.key === 'X') {
                axisLock = axisLock === 'x' ? null : 'x';
                e.preventDefault();
            }
            if (e.key === 'y' || e.key === 'Y') {
                axisLock = axisLock === 'y' ? null : 'y';
                e.preventDefault();
            }
            if (e.key === 'z' || e.key === 'Z') {
                axisLock = axisLock === 'z' ? null : 'z';
                e.preventDefault();
            }
        }
        
        // Duplicar (Ctrl+D)
        if (e.ctrlKey && e.key === 'd') {
            duplicateSelected();
            e.preventDefault();
        }
        
        // Hide/Show (H)
        if (e.key === 'h' || e.key === 'H') {
            selectedIndices.forEach(idx => toggleObjectVisibility(idx));
            e.preventDefault();
        }
        
        // Delete
        if (e.key === 'Delete' || e.key === 'x') {
            deleteSelected();
            e.preventDefault();
        }
        
        // FASE 2: Novos hotkeys
        // Toggle Grid (Ctrl+G)
        if (e.ctrlKey && (e.key === 'g' || e.key === 'G')) {
            toggleGrid();
            e.preventDefault();
        }
        
        // Toggle Snap (Ctrl+Shift+S)
        if (e.ctrlKey && e.shiftKey && (e.key === 's' || e.key === 'S')) {
            toggleSnap();
            e.preventDefault();
        }
        
        // Measurement tool (M)
        if (e.key === 'm' || e.key === 'M') {
            startMeasurement();
            e.preventDefault();
        }
        
        // Toggle Wireframe (Ctrl+W)
        if (e.ctrlKey && (e.key === 'w' || e.key === 'W')) {
            toggleWireframe();
            e.preventDefault();
        }
        
        // Views (numpad)
        if (e.key === '1') {
            setViewportMode('front');
            e.preventDefault();
        }
        if (e.key === '3') {
            setViewportMode('side');
            e.preventDefault();
        }
        if (e.key === '7') {
            setViewportMode('top');
            e.preventDefault();
        }
        if (e.key === '5') {
            setViewportMode('perspective');
            e.preventDefault();
        }
        
        updateBottomBar();
    });

    window.addEventListener('keyup', function(e) {
        keyPressed[e.key] = false;
    });

    // Funções de manipulação
    function duplicateSelected() {
        if (selectedIndices.length === 0) return;
        
        const newIndices = [];
        selectedIndices.forEach(idx => {
            const original = objectList[idx];
            if (original && !original.locked) {
                const newMesh = original.mesh.clone(original.name + '_copy');
                newMesh.position.x += 2;
                newMesh.position.z += 2;
                
                const newObj = {
                    name: newMesh.name,
                    mesh: newMesh,
                    type: original.type,
                    selected: false,
                    visible: true,
                    locked: false,
                    layer: original.layer,
                    props: { ...original.props }
                };
                
                objectList.push(newObj);
                newIndices.push(objectList.length - 1);
            }
        });
        
        // Selecionar objetos duplicados
        if (newIndices.length > 0) {
            selectedIndices = newIndices;
            selectedIdx = newIndices[newIndices.length - 1];
            updateObjectList();
            updateGizmoSelection();
        }
    }

    function deleteSelected() {
        if (selectedIndices.length === 0) return;
        
        // Ordenar índices em ordem decrescente para deletar do final
        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
        
        sortedIndices.forEach(idx => {
            const obj = objectList[idx];
            if (obj && !obj.locked) {
                if (obj.mesh) {
                    obj.mesh.dispose();
                }
                objectList.splice(idx, 1);
            }
        });
        
        clearSelection();
        updateObjectList();
    }

    function toggleObjectVisibility(index) {
        const obj = objectList[index];
        if (obj && !obj.locked) {
            obj.visible = !obj.visible;
            if (obj.mesh) {
                obj.mesh.setEnabled(obj.visible);
            }
            updateObjectList();
        }
    }

    function toggleObjectLock(index) {
        const obj = objectList[index];
        if (obj) {
            obj.locked = !obj.locked;
            updateObjectList();
            updateGizmoSelection(); // Re-avaliar gizmo se objeto ficou locked
        }
    }

    // Sistema de grupos
    function createGroup(name, objectIndices) {
        const group = {
            name: name,
            objects: [...objectIndices],
            visible: true,
            locked: false
        };
        
        // Marcar objetos como pertencentes ao grupo
        objectIndices.forEach(idx => {
            if (objectList[idx]) {
                objectList[idx].groupName = name;
            }
        });
        
        objectGroups.push(group);
        updateObjectList();
    }

    function toggleGroupVisibility(groupName) {
        const group = objectGroups.find(g => g.name === groupName);
        if (group) {
            group.visible = !group.visible;
            group.objects.forEach(idx => {
                const obj = objectList[idx];
                if (obj && obj.mesh) {
                    obj.mesh.setEnabled(group.visible);
                }
            });
            updateObjectList();
        }
    }

    function deleteGroup(groupName) {
        const groupIndex = objectGroups.findIndex(g => g.name === groupName);
        if (groupIndex > -1) {
            const group = objectGroups[groupIndex];
            
            // Remover marcação de grupo dos objetos
            group.objects.forEach(idx => {
                if (objectList[idx]) {
                    delete objectList[idx].groupName;
                }
            });
            
            objectGroups.splice(groupIndex, 1);
            updateObjectList();
        }
    }

    // Selection Sets
    function saveSelectionSet(name) {
        if (selectedIndices.length > 0) {
            selectionSets[name] = [...selectedIndices];
            updateSelectionSetsUI();
        }
    }

    function loadSelectionSet(name) {
        if (selectionSets[name]) {
            selectedIndices = [...selectionSets[name]];
            selectedIdx = selectedIndices[selectedIndices.length - 1] || null;
            updateObjectList();
            updateGizmoSelection();
            updateBottomBar();
        }
    }

    function updateSelectionSetsUI() {
        const container = document.getElementById('selection-sets-list');
        if (container) {
            container.innerHTML = '';
            Object.keys(selectionSets).forEach(name => {
                const div = document.createElement('div');
                div.style.cssText = 'padding:4px;margin:2px 0;background:#2a2a3a;border-radius:4px;cursor:pointer;display:flex;justify-content:space-between;';
                div.innerHTML = `
                    <span onclick="loadSelectionSet('${name}')">${name} (${selectionSets[name].length})</span>
                    <button onclick="deleteSelectionSet('${name}')" style="background:none;border:none;color:#ff6b6b;">✖</button>
                    <button onclick="renameSelectionSet('${name}')" style="background:none;border:none;color:#4CAF50;margin-left:5px;">✎</button>
                `;
                container.appendChild(div);
            });
        }
    }
    
    // Função para deletar selection set
    function deleteSelectionSet(name) {
        if (confirm(`Excluir set '${name}'?`)) {
            delete selectionSets[name];
            updateSelectionSetsUI();
        }
    }
    
    // Função para renomear selection set
    function renameSelectionSet(oldName) {
        const newName = prompt(`Novo nome para '${oldName}':`, oldName);
        if (newName && newName.trim() && newName !== oldName) {
            selectionSets[newName.trim()] = selectionSets[oldName];
            delete selectionSets[oldName];
            updateSelectionSetsUI();
        }
    }

    // Layers
    function setObjectLayer(index, layer) {
        const obj = objectList[index];
        if (obj) {
            obj.layer = layer;
            updateObjectList();
        }
    }

    // Busca/Filtro
    const searchInput = document.getElementById('object-search');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            searchFilter = e.target.value.toLowerCase();
            updateObjectList();
        });
    }

    // Event handlers para UI - com verificação de existência
    const gizmoMoveBtn = document.getElementById('gizmo-move');
    if (gizmoMoveBtn) {
        gizmoMoveBtn.onclick = () => updateGizmoMode('move');
    }

    const gizmoRotateBtn = document.getElementById('gizmo-rotate');
    if (gizmoRotateBtn) {
        gizmoRotateBtn.onclick = () => updateGizmoMode('rotate');
    }

    const gizmoScaleBtn = document.getElementById('gizmo-scale');
    if (gizmoScaleBtn) {
        gizmoScaleBtn.onclick = () => updateGizmoMode('scale');
    }

    const deselectBtn = document.getElementById('deselect-all');
    if (deselectBtn) {
        deselectBtn.onclick = function() {
            clearSelection();
        };
    }
    
    const duplicateBtn = document.getElementById('duplicate-selected');
    if (duplicateBtn) {
        duplicateBtn.onclick = function() {
            duplicateSelected();
        };
    }
    
    const deleteBtn = document.getElementById('delete-selected');
    if (deleteBtn) {
        deleteBtn.onclick = function() {
            deleteSelected();
        };
    }
    
    const groupBtn = document.getElementById('group-selected');
    if (groupBtn) {
        groupBtn.onclick = function() {
            if (selectedIndices.length > 1) {
                const groupName = prompt('Nome do grupo:', `Grupo ${objectGroups.length + 1}`);
                if (groupName) {
                    createGroup(groupName, selectedIndices);
                }
            }
        };
    }
    
    const hideBtn = document.getElementById('hide-selected');
    if (hideBtn) {
        hideBtn.onclick = function() {
            selectedIndices.forEach(idx => toggleObjectVisibility(idx));
        };
    }
    
    const lockBtn = document.getElementById('lock-selected');
    if (lockBtn) {
        lockBtn.onclick = function() {
            selectedIndices.forEach(idx => toggleObjectLock(idx));
        };
    }
    
    // Selection Sets
    const saveSelectionBtn = document.getElementById('save-selection-set');
    if (saveSelectionBtn) {
        saveSelectionBtn.onclick = function() {
            const nameInput = document.getElementById('selection-set-name');
            if (nameInput) {
                const name = nameInput.value.trim();
                if (name && selectedIndices.length > 0) {
                    saveSelectionSet(name);
                    nameInput.value = '';
                    updateSelectionSetsUI();
                }
            }
        };
    }
    
    // Layers
    const assignLayerBtn = document.getElementById('assign-layer');
    if (assignLayerBtn) {
        assignLayerBtn.onclick = function() {
            const layerSelect = document.getElementById('layer-select');
            if (layerSelect) {
                const layer = layerSelect.value;
                selectedIndices.forEach(idx => setObjectLayer(idx, layer));
            }
        };
    }
    
    // FASE 2: Event listeners para ferramentas de precisão
    const toggleGridBtn = document.getElementById('toggle-grid');
    if (toggleGridBtn) {
        toggleGridBtn.onclick = function() {
            toggleGrid();
            this.style.background = gridEnabled ? '#27ae60' : '#34495e';
        };
    }
    
    const toggleSnapBtn = document.getElementById('toggle-snap');
    if (toggleSnapBtn) {
        toggleSnapBtn.onclick = function() {
            toggleSnap();
            this.style.background = snapEnabled ? '#27ae60' : '#34495e';
        };
    }
    
    const gridSizeInput = document.getElementById('grid-size');
    if (gridSizeInput) {
        gridSizeInput.onchange = function() {
            setGridSize(this.value);
        };
    }
    
    const measurementBtn = document.getElementById('measurement-tool');
    if (measurementBtn) {
        measurementBtn.onclick = function() {
            startMeasurement();
            this.style.background = measurementMode ? '#e74c3c' : '#34495e';
        };
    }
    
    // Ferramentas de alinhamento
    const alignLeftBtn = document.getElementById('align-left');
    if (alignLeftBtn) {
        alignLeftBtn.onclick = () => alignObjects('left');
    }
    
    const alignCenterXBtn = document.getElementById('align-center-x');
    if (alignCenterXBtn) {
        alignCenterXBtn.onclick = () => alignObjects('center-x');
    }
    
    const alignRightBtn = document.getElementById('align-right');
    if (alignRightBtn) {
        alignRightBtn.onclick = () => alignObjects('right');
    }
    
    const distributeXBtn = document.getElementById('distribute-x');
    if (distributeXBtn) {
        distributeXBtn.onclick = () => distributeObjects('x');
    }
    
    const distributeZBtn = document.getElementById('distribute-z');
    if (distributeZBtn) {
        distributeZBtn.onclick = () => distributeObjects('z');
    }
    
    // Controles de visualização
    const viewPerspectiveBtn = document.getElementById('view-perspective');
    if (viewPerspectiveBtn) {
        viewPerspectiveBtn.onclick = () => setViewportMode('perspective');
    }
    
    const viewTopBtn = document.getElementById('view-top');
    if (viewTopBtn) {
        viewTopBtn.onclick = () => setViewportMode('top');
    }
    
    const viewFrontBtn = document.getElementById('view-front');
    if (viewFrontBtn) {
        viewFrontBtn.onclick = () => setViewportMode('front');
    }
    
    const viewSideBtn = document.getElementById('view-side');
    if (viewSideBtn) {
        viewSideBtn.onclick = () => setViewportMode('side');
    }
    
    const toggleWireframeBtn = document.getElementById('toggle-wireframe');
    if (toggleWireframeBtn) {
        toggleWireframeBtn.onclick = function() {
            toggleWireframe();
            this.style.background = wireframeMode ? '#e74c3c' : '#34495e';
        };
    }

    // Assets Browser - Carregamento automático de modelos GLB
    var assetsBrowserEl = document.getElementById('assets-browser');
    
    // Função para carregar lista de assets automaticamente
    function loadAssetsList() {
        if (!assetsBrowserEl) {
            console.warn('Elemento assets-browser não encontrado');
            return;
        }

        console.log('Iniciando carregamento automático de assets...');
        assetsBrowserEl.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">🔄 Carregando modelos 3D do projeto...</div>';
        
        // Função para descobrir assets automaticamente
        async function discoverAssets() {
            try {
                console.log('Descobrindo assets na pasta assets/models/...');
                
                // Função para tentar descobrir assets via fetch
                async function tryDiscoverViaFetch() {
                    try {
                        // Tentar carregar um arquivo de índice (se existir)
                        const response = await fetch('../assets/models/index.json');
                        if (response.ok) {
                            const index = await response.json();
                            return index.files || [];
                        }
                    } catch (e) {
                        console.log('Arquivo index.json não encontrado, usando lista conhecida');
                    }
                    return null;
                }

                // Tentar descoberta automática primeiro
                let discoveredAssets = await tryDiscoverViaFetch();
                
                // Se não encontrou via fetch, usar lista conhecida dos assets existentes
                if (!discoveredAssets) {
                    discoveredAssets = [
                        'kenney_fantasy-town-kit_2.0/balcony-wall-fence.glb',
                        'kenney_fantasy-town-kit_2.0/balcony-wall.glb',
                        'kenney_fantasy-town-kit_2.0/banner-green.glb',
                        'kenney_fantasy-town-kit_2.0/banner-red.glb',
                        'kenney_fantasy-town-kit_2.0/blade.glb',
                        'kenney_fantasy-town-kit_2.0/cart-high.glb',
                        'kenney_fantasy-town-kit_2.0/cart.glb',
                        'kenney_fantasy-town-kit_2.0/chimney-base.glb',
                        'kenney_fantasy-town-kit_2.0/chimney-top.glb',
                        'kenney_fantasy-town-kit_2.0/chimney.glb',
                        'kenney_fantasy-town-kit_2.0/fence-broken.glb',
                        'kenney_fantasy-town-kit_2.0/fence-curved.glb',
                        'kenney_fantasy-town-kit_2.0/fence-gate.glb',
                        'kenney_fantasy-town-kit_2.0/fence.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-center.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-corner-inner-square.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-corner-inner.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-corner.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-curved.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-edge.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-round-detail.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-round.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-square-detail.glb',
                        'kenney_fantasy-town-kit_2.0/fountain-square.glb',
                        'kenney_fantasy-town-kit_2.0/hedge-curved.glb',
                        'kenney_fantasy-town-kit_2.0/hedge-gate.glb',
                        'kenney_fantasy-town-kit_2.0/hedge-large-curved.glb',
                        'kenney_fantasy-town-kit_2.0/hedge-large-gate.glb',
                        'kenney_fantasy-town-kit_2.0/hedge-large.glb',
                        'kenney_fantasy-town-kit_2.0/hedge.glb',
                        'kenney_fantasy-town-kit_2.0/lantern.glb',
                        'kenney_fantasy-town-kit_2.0/overhang.glb',
                        'kenney_fantasy-town-kit_2.0/pillar-stone.glb',
                        'kenney_fantasy-town-kit_2.0/pillar-wood.glb',
                        'kenney_fantasy-town-kit_2.0/planks-half.glb',
                        'kenney_fantasy-town-kit_2.0/planks-opening.glb',
                        'kenney_fantasy-town-kit_2.0/planks.glb',
                        'kenney_fantasy-town-kit_2.0/poles-horizontal.glb',
                        'kenney_fantasy-town-kit_2.0/poles.glb',
                        'kenney_fantasy-town-kit_2.0/road-bend.glb',
                        'kenney_fantasy-town-kit_2.0/road-corner-inner.glb',
                        'kenney_fantasy-town-kit_2.0/road-corner.glb',
                        'kenney_fantasy-town-kit_2.0/road-curb-end.glb',
                        'kenney_fantasy-town-kit_2.0/road-curb.glb',
                        'kenney_fantasy-town-kit_2.0/road-edge-slope.glb',
                        'kenney_fantasy-town-kit_2.0/road-edge.glb',
                        'kenney_fantasy-town-kit_2.0/road-slope.glb',
                        'kenney_fantasy-town-kit_2.0/road.glb',
                        'kenney_fantasy-town-kit_2.0/rock-large.glb',
                        'kenney_fantasy-town-kit_2.0/rock-small.glb',
                        'kenney_fantasy-town-kit_2.0/rock-wide.glb',
                        'kenney_fantasy-town-kit_2.0/roof-corner-inner.glb',
                        'kenney_fantasy-town-kit_2.0/roof-corner-round.glb',
                        'kenney_fantasy-town-kit_2.0/roof-corner.glb',
                        'kenney_fantasy-town-kit_2.0/roof-flat.glb',
                        'kenney_fantasy-town-kit_2.0/roof-gable-detail.glb',
                        'kenney_fantasy-town-kit_2.0/roof-gable-end.glb',
                        'kenney_fantasy-town-kit_2.0/roof-gable-top.glb',
                        'kenney_fantasy-town-kit_2.0/roof-gable.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-corner-round.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-corner.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-cornerinner.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-flat.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-gable-detail.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-gable-end.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-gable-top.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-gable.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-left.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-point.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-right.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high-window.glb',
                        'kenney_fantasy-town-kit_2.0/roof-high.glb',
                        'kenney_fantasy-town-kit_2.0/roof-left.glb',
                        'kenney_fantasy-town-kit_2.0/roof-point.glb',
                        'kenney_fantasy-town-kit_2.0/roof-right.glb',
                        'kenney_fantasy-town-kit_2.0/roof-window.glb',
                        'kenney_fantasy-town-kit_2.0/roof.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-full-corner-inner.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-full-corner-outer.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-full.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-stone-corner.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-stone-handrail.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-stone-round.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-stone.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-wide-stone-handrail.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-wide-stone.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-wide-wood-handrail.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-wide-wood.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-wood-handrail.glb',
                        'kenney_fantasy-town-kit_2.0/stairs-wood.glb',
                        'kenney_fantasy-town-kit_2.0/stall-bench.glb',
                        'kenney_fantasy-town-kit_2.0/stall-green.glb',
                        'kenney_fantasy-town-kit_2.0/stall-red.glb',
                        'kenney_fantasy-town-kit_2.0/stall-stool.glb',
                        'kenney_fantasy-town-kit_2.0/stall.glb',
                        'kenney_fantasy-town-kit_2.0/tree-crooked.glb',
                        'kenney_fantasy-town-kit_2.0/tree-high-crooked.glb',
                        'kenney_fantasy-town-kit_2.0/tree-high-round.glb',
                        'kenney_fantasy-town-kit_2.0/tree-high.glb',
                        'kenney_fantasy-town-kit_2.0/tree.glb',
                        'kenney_fantasy-town-kit_2.0/wall-arch-top-detail.glb',
                        'kenney_fantasy-town-kit_2.0/wall-arch-top.glb',
                        'kenney_fantasy-town-kit_2.0/wall-arch.glb',
                        'kenney_fantasy-town-kit_2.0/wall-block-half.glb',
                        'kenney_fantasy-town-kit_2.0/wall-block.glb',
                        'kenney_fantasy-town-kit_2.0/wall-broken.glb',
                        'kenney_fantasy-town-kit_2.0/wall-corner-detail.glb',
                        'kenney_fantasy-town-kit_2.0/wall-corner-diagonal-half.glb',
                        'kenney_fantasy-town-kit_2.0/wall-corner-diagonal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-corner-edge.glb',
                        'kenney_fantasy-town-kit_2.0/wall-corner.glb',
                        'kenney_fantasy-town-kit_2.0/wall-curved.glb',
                        'kenney_fantasy-town-kit_2.0/wall-detail-cross.glb',
                        'kenney_fantasy-town-kit_2.0/wall-detail-diagonal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-detail-horizontal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-diagonal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-door.glb',
                        'kenney_fantasy-town-kit_2.0/wall-doorway-base.glb',
                        'kenney_fantasy-town-kit_2.0/wall-doorway-round.glb',
                        'kenney_fantasy-town-kit_2.0/wall-doorway-square-wide-curved.glb',
                        'kenney_fantasy-town-kit_2.0/wall-doorway-square-wide.glb',
                        'kenney_fantasy-town-kit_2.0/wall-doorway-square.glb',
                        'kenney_fantasy-town-kit_2.0/wall-half.glb',
                        'kenney_fantasy-town-kit_2.0/wall-rounded.glb',
                        'kenney_fantasy-town-kit_2.0/wall-side.glb',
                        'kenney_fantasy-town-kit_2.0/wall-slope.glb',
                        'kenney_fantasy-town-kit_2.0/wall-window-glass.glb',
                        'kenney_fantasy-town-kit_2.0/wall-window-round.glb',
                        'kenney_fantasy-town-kit_2.0/wall-window-shutters.glb',
                        'kenney_fantasy-town-kit_2.0/wall-window-small.glb',
                        'kenney_fantasy-town-kit_2.0/wall-window-stone.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-arch-top-detail.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-arch-top.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-arch.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-block-half.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-block.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-broken.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-corner-diagonal-half.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-corner-diagonal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-corner-edge.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-corner.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-curved.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-detail-cross.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-detail-diagonal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-detail-horizontal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-diagonal.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-door.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-doorway-base.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-doorway-round.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-doorway-square-wide-curved.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-doorway-square-wide.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-doorway-square.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-half.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-rounded.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-side.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-slope.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-window-glass.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-window-round.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-window-shutters.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-window-small.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood-window-stone.glb',
                        'kenney_fantasy-town-kit_2.0/wall-wood.glb',
                        'kenney_fantasy-town-kit_2.0/wall.glb',
                        'kenney_fantasy-town-kit_2.0/watermill-wide.glb',
                        'kenney_fantasy-town-kit_2.0/watermill.glb',
                        'kenney_fantasy-town-kit_2.0/wheel.glb',
                        'kenney_fantasy-town-kit_2.0/windmill.glb'
                    ];
                }
                
                console.log(`Descobertos ${discoveredAssets.length} assets GLB`);
                return discoveredAssets;
            } catch (error) {
                console.error('Erro ao descobrir assets:', error);
                return [];
            }
        }

        // Função para categorizar assets baseado no nome
        function categorizeAsset(assetPath) {
            const fileName = assetPath.split('/').pop().toLowerCase();
            
            if (fileName.includes('wall') || fileName.includes('block')) return 'Walls & Blocks';
            if (fileName.includes('roof') || fileName.includes('chimney')) return 'Roofs & Tops';
            if (fileName.includes('stairs') || fileName.includes('stair')) return 'Stairs & Steps';
            if (fileName.includes('fountain') || fileName.includes('water')) return 'Water Features';
            if (fileName.includes('fence') || fileName.includes('hedge')) return 'Fences & Hedges';
            if (fileName.includes('tree') || fileName.includes('rock')) return 'Nature Elements';
            if (fileName.includes('road') || fileName.includes('path')) return 'Roads & Paths';
            if (fileName.includes('stall') || fileName.includes('cart')) return 'Market & Trade';
            if (fileName.includes('banner') || fileName.includes('lantern')) return 'Decorations';
            if (fileName.includes('door') || fileName.includes('window')) return 'Doors & Windows';
            if (fileName.includes('pillar') || fileName.includes('pole')) return 'Support Structures';
            if (fileName.includes('mill') || fileName.includes('wheel')) return 'Machinery';
            if (fileName.includes('balcony') || fileName.includes('overhang')) return 'Balconies & Overhangs';
            if (fileName.includes('plank') || fileName.includes('blade')) return 'Wooden Elements';
            
            return 'Other Elements';
        }
        
        // Função para carregar modelo GLB real
        function loadGLBAsset(assetPath) {
            console.log(`Carregando GLB: ${assetPath}`);
            
            // Caminho para o arquivo GLB (já inclui o caminho da pasta)
            const fullAssetPath = `../assets/models/${assetPath}`;
            
            BABYLON.SceneLoader.ImportMesh("", "", fullAssetPath, scene, function (meshes) {
                if (meshes.length > 0) {
                    console.log(`✅ GLB carregado com sucesso: ${assetPath}`);
                    
                    // Criar TransformNode para agrupar todas as meshes do GLB
                    const rootNode = new BABYLON.TransformNode(`glb_${objectList.length}`, scene);
                    
                    // Definir posição inicial
                    rootNode.position.y = 1;
                    rootNode.position.x = Math.random() * 6 - 3;
                    rootNode.position.z = Math.random() * 6 - 3;
                    
                    // Agrupar todas as meshes sob o TransformNode
                    meshes.forEach(mesh => {
                        if (mesh.parent === null) {
                            mesh.parent = rootNode;
                        }
                        // Manter as meshes selecionáveis para que possam ser clicadas
                        mesh.isPickable = true;
                        // Adicionar referência ao rootNode para facilitar a seleção
                        mesh.rootNodeParent = rootNode;
                    });
                    
                    // Garantir que o rootNode seja selecionável
                    rootNode.isPickable = true;
                    
                    // Adicionar à lista de objetos
                    const fileName = assetPath.split('/').pop();
                    const cleanName = fileName.replace('.glb', '').replace(/-/g, ' ');
                    objectList.push({
                        name: cleanName,
                        mesh: rootNode,
                        type: 'GLB',
                        selected: false,
                        visible: true,
                        locked: false,
                        layer: 'imported',
                        props: { movel: false, perigo: false, plataforma: false, decorativo: true },
                        assetPath: assetPath,
                        childMeshes: meshes
                    });
                    
                    updateObjectList();
                    updateBottomBar();
                } else {
                    console.warn(`⚠️ Nenhuma mesh encontrada em: ${assetPath}`);
                }
            }, null, function (scene, message, exception) {
                console.error(`❌ Erro ao carregar ${assetPath}:`, message, exception);
            });
        }
        
        // Carregar e renderizar assets
        discoverAssets().then(assets => {
            if (assets.length === 0) {
                assetsBrowserEl.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">❌ Nenhum modelo GLB encontrado</div>';
                return;
            }
            
            // Organizar por categorias
            const categories = {};
            assets.forEach(asset => {
                const category = categorizeAsset(asset);
                if (!categories[category]) categories[category] = [];
                categories[category].push(asset);
            });
            
            // Renderizar lista de assets
            let html = `<div style="margin-bottom:12px;font-weight:bold;color:#3a7bd5;">🏰 Fantasy Town Kit (${assets.length} models)</div>`;
            html += '<div style="margin-bottom:8px;font-size:0.8em;color:#888;">Clique nos modelos para adicionar à cena:</div>';
            
            // Organizar por categorias
            Object.keys(categories).sort().forEach(category => {
                html += `<div style="margin:12px 0 6px 0;font-size:0.9em;color:#7fb3d3;font-weight:bold;border-bottom:1px solid #444;padding-bottom:2px;">${category} (${categories[category].length})</div>`;
                
                categories[category].forEach(asset => {
                    const fileName = asset.split('/').pop();
                    const displayName = fileName.replace('.glb', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    html += `
                        <div class="asset-item" onclick="window.loadGLBAsset && window.loadGLBAsset('${asset}')" 
                             style="padding:4px 6px;margin:1px 0;background:#2c3e50;border-radius:3px;cursor:pointer;font-size:0.8em;display:flex;align-items:center;gap:6px;transition:background 0.2s;"
                             onmouseover="this.style.background='#34495e'"
                             onmouseout="this.style.background='#2c3e50'"
                             title="Clique para adicionar ${displayName} à cena">
                            <span style="font-size:1em;">🏰</span>
                            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayName}</span>
                        </div>
                    `;
                });
            });
            
            assetsBrowserEl.innerHTML = html;
            
            // Expor função globalmente
            window.loadGLBAsset = loadGLBAsset;
            
            // Expor outras funções globalmente para uso no HTML
            window.deleteSelectionSet = deleteSelectionSet;
            window.renameSelectionSet = renameSelectionSet;
            window.loadSelectionSet = loadSelectionSet;
            window.renameObject = renameObject;
            window.updateObjectProp = updateObjectProp;
            window.setObjectLayer = setObjectLayer;
            window.updateObjectTransform = updateObjectTransform;
            window.resetSelectedTransforms = resetSelectedTransforms;
            window.updateObjectColor = updateObjectColor;
            window.deleteSelectedObjects = deleteSelectedObjects;
            
            // FASE 2: Expor funções de precisão
            window.toggleGrid = toggleGrid;
            window.toggleSnap = toggleSnap;
            window.setGridSize = setGridSize;
            window.startMeasurement = startMeasurement;
            window.alignObjects = alignObjects;
            window.distributeObjects = distributeObjects;
            window.setViewportMode = setViewportMode;
            window.toggleWireframe = toggleWireframe;
            
            console.log(`✅ Assets browser renderizado com ${assets.length} modelos em ${Object.keys(categories).length} categorias`);
        });
    }
    
    // Carregar assets após um pequeno delay para garantir que tudo foi inicializado
    setTimeout(function() {
        console.log('Timeout executado, carregando assets...');
        loadAssetsList();
    }, 500);

    // Event Listeners para teclas de gizmo
    document.addEventListener('keydown', function(e) {
        if (e.target.tagName === 'INPUT') return;
        
        switch(e.key.toLowerCase()) {
            case 'g':
                updateGizmoMode('move');
                break;
            case 'r':
                updateGizmoMode('rotate');
                break;
            case 's':
                updateGizmoMode('scale');
                break;
        }
        updateBottomBar();
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
    
    // ============================================================================
    // FASE 2: FERRAMENTAS DE PRECISÃO
    // ============================================================================
    
    // Função para criar grid visual
    function createGridHelper() {
        if (gridHelper) {
            gridHelper.dispose();
        }
        
        const size = 50;
        const divisions = size / gridSize;
        
        // Criar linhas do grid
        const points = [];
        const colors = [];
        
        // Linhas paralelas ao eixo X
        for (let i = 0; i <= divisions; i++) {
            const y = (i - divisions/2) * gridSize;
            points.push([
                new BABYLON.Vector3(-size/2, 0.01, y),
                new BABYLON.Vector3(size/2, 0.01, y)
            ]);
            
            // Linha central mais visível
            const color = (i === divisions/2) ? new BABYLON.Color3(0.7, 0.7, 0.7) : new BABYLON.Color3(0.3, 0.3, 0.3);
            colors.push([color, color]);
        }
        
        // Linhas paralelas ao eixo Z
        for (let i = 0; i <= divisions; i++) {
            const x = (i - divisions/2) * gridSize;
            points.push([
                new BABYLON.Vector3(x, 0.01, -size/2),
                new BABYLON.Vector3(x, 0.01, size/2)
            ]);
            
            const color = (i === divisions/2) ? new BABYLON.Color3(0.7, 0.7, 0.7) : new BABYLON.Color3(0.3, 0.3, 0.3);
            colors.push([color, color]);
        }
        
        gridHelper = BABYLON.MeshBuilder.CreateLineSystem("grid", {lines: points, colors: colors}, scene);
        gridHelper.isPickable = false;
        gridHelper.setEnabled(gridEnabled);
    }
    
    // Função para aplicar snap a uma posição
    function applySnap(position) {
        if (!snapEnabled) return position;
        
        const snappedPos = position.clone();
        
        if (snapToGrid) {
            snappedPos.x = Math.round(position.x / gridSize) * gridSize;
            snappedPos.z = Math.round(position.z / gridSize) * gridSize;
            // Y pode ser snapped para incrementos menores
            snappedPos.y = Math.round(position.y / (gridSize / 2)) * (gridSize / 2);
        }
        
        if (snapToObjects) {
            // Encontrar objetos próximos para snap
            const snapDistance = gridSize * 0.5;
            for (const obj of objectList) {
                if (obj.mesh && obj.mesh.position) {
                    const distance = BABYLON.Vector3.Distance(position, obj.mesh.position);
                    if (distance < snapDistance) {
                        return obj.mesh.position.clone();
                    }
                }
            }
        }
        
        return snappedPos;
    }
    
    // Função para medir distância entre dois pontos
    function startMeasurement() {
        measurementMode = true;
        measurementStart = null;
        if (measurementLine) {
            measurementLine.dispose();
            measurementLine = null;
        }
        console.log('Modo medição ativado - clique em dois pontos');
    }
    
    function createMeasurementLine(start, end) {
        if (measurementLine) {
            measurementLine.dispose();
        }
        
        const points = [start, end];
        measurementLine = BABYLON.MeshBuilder.CreateLines("measurement", {points: points}, scene);
        measurementLine.color = new BABYLON.Color3(1, 1, 0); // Amarelo
        measurementLine.isPickable = false;
        
        // Calcular e exibir distância
        const distance = BABYLON.Vector3.Distance(start, end);
        console.log(`Distância: ${distance.toFixed(2)} unidades`);
        
        // Criar texto 3D da medida (opcional)
        const midPoint = BABYLON.Vector3.Center(start, end);
        midPoint.y += 1;
    }
    
    // Função para alinhar objetos selecionados
    function alignObjects(alignType) {
        if (selectedIndices.length < 2) {
            alert('Selecione pelo menos 2 objetos para alinhar');
            return;
        }
        
        const objects = selectedIndices.map(i => objectList[i]).filter(obj => obj && obj.mesh);
        if (objects.length < 2) return;
        
        // Usar o primeiro objeto como referência
        const reference = objects[0].mesh.position;
        
        objects.slice(1).forEach(obj => {
            switch (alignType) {
                case 'left': // Alinhar X
                    obj.mesh.position.x = reference.x;
                    break;
                case 'center-x':
                    // Calcular centro X de todos objetos
                    const avgX = objects.reduce((sum, o) => sum + o.mesh.position.x, 0) / objects.length;
                    objects.forEach(o => o.mesh.position.x = avgX);
                    return; // Sair para não processar outros objetos
                case 'right':
                    // Para alinhar à direita, usar o objeto mais à direita como referência
                    const maxX = Math.max(...objects.map(o => o.mesh.position.x));
                    objects.forEach(o => o.mesh.position.x = maxX);
                    return;
                case 'top': // Alinhar Y
                    obj.mesh.position.y = reference.y;
                    break;
                case 'bottom':
                    obj.mesh.position.z = reference.z;
                    break;
            }
        });
        
        updateObjectProperties();
        console.log(`Objetos alinhados: ${alignType}`);
    }
    
    // Função para distribuir objetos uniformemente
    function distributeObjects(axis) {
        if (selectedIndices.length < 3) {
            alert('Selecione pelo menos 3 objetos para distribuir');
            return;
        }
        
        const objects = selectedIndices.map(i => objectList[i]).filter(obj => obj && obj.mesh);
        if (objects.length < 3) return;
        
        // Ordenar objetos pela posição no eixo especificado
        objects.sort((a, b) => a.mesh.position[axis] - b.mesh.position[axis]);
        
        const first = objects[0].mesh.position[axis];
        const last = objects[objects.length - 1].mesh.position[axis];
        const step = (last - first) / (objects.length - 1);
        
        objects.forEach((obj, index) => {
            obj.mesh.position[axis] = first + (step * index);
        });
        
        updateObjectProperties();
        console.log(`Objetos distribuídos no eixo ${axis}`);
    }
    
    // Função para alternar modo de visualização
    function setViewportMode(mode) {
        viewportMode = mode;
        
        switch (mode) {
            case 'top':
                camera.setTarget(BABYLON.Vector3.Zero());
                camera.alpha = 0;
                camera.beta = 0;
                camera.radius = 20;
                break;
            case 'front':
                camera.setTarget(BABYLON.Vector3.Zero());
                camera.alpha = 0;
                camera.beta = Math.PI / 2;
                camera.radius = 20;
                break;
            case 'side':
                camera.setTarget(BABYLON.Vector3.Zero());
                camera.alpha = Math.PI / 2;
                camera.beta = Math.PI / 2;
                camera.radius = 20;
                break;
            case 'perspective':
                camera.setTarget(BABYLON.Vector3.Zero());
                camera.alpha = Math.PI / 2;
                camera.beta = Math.PI / 3;
                camera.radius = 16;
                break;
        }
        
        console.log(`Modo de visualização: ${mode}`);
    }
    
    // Função para alternar wireframe
    function toggleWireframe() {
        wireframeMode = !wireframeMode;
        
        objectList.forEach(obj => {
            if (obj.mesh && obj.mesh.material) {
                obj.mesh.material.wireframe = wireframeMode;
            }
        });
        
        console.log(`Wireframe: ${wireframeMode ? 'ON' : 'OFF'}`);
    }
    
    // Função para alternar grid
    function toggleGrid() {
        gridEnabled = !gridEnabled;
        if (gridHelper) {
            gridHelper.setEnabled(gridEnabled);
        }
        console.log(`Grid: ${gridEnabled ? 'ON' : 'OFF'}`);
    }
    
    // Função para alterar tamanho do grid
    function setGridSize(size) {
        gridSize = parseFloat(size);
        createGridHelper();
        console.log(`Grid size: ${gridSize}`);
    }
    
    // Função para alternar snap
    function toggleSnap() {
        snapEnabled = !snapEnabled;
        console.log(`Snap: ${snapEnabled ? 'ON' : 'OFF'}`);
    }

    // ============================================================================
    // FASE 2: INTERFACE AVANÇADA
    // ============================================================================

    // Context Menu Functions
    function showContextMenu(x, y, target) {
        currentContextMenuTarget = target;
        const contextMenu = document.getElementById('context-menu');
        
        // Atualizar estado dos itens baseado na seleção
        const items = contextMenu.querySelectorAll('.context-menu-item');
        items.forEach(item => {
            const action = item.getAttribute('data-action');
            item.classList.remove('disabled');
            
            if (selectedIndices.length === 0 && ['duplicate', 'group', 'hide', 'lock', 'delete'].includes(action)) {
                item.classList.add('disabled');
            }
        });
        
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
        contextMenu.style.display = 'block';
    }

    function hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.display = 'none';
        currentContextMenuTarget = null;
    }

    function handleContextMenuAction(action) {
        hideContextMenu();
        
        switch(action) {
            case 'properties':
                showPropertiesPanel();
                break;
            case 'duplicate':
                duplicateSelectedObjects();
                break;
            case 'group':
                groupSelectedObjects();
                break;
            case 'hide':
                hideSelectedObjects();
                break;
            case 'lock':
                lockSelectedObjects();
                break;
            case 'delete':
                deleteSelectedObjects();
                break;
        }
    }

    // Properties Panel Functions
    function showPropertiesPanel() {
        if (selectedIndices.length === 0) {
            showToast('Selecione um objeto para ver suas propriedades', 'warning');
            return;
        }
        
        const panel = document.getElementById('properties-panel');
        const content = document.getElementById('properties-content');
        
        // Gerar conteúdo das propriedades
        content.innerHTML = generatePropertiesContent();
        
        panel.style.display = 'block';
        propertiesPanelVisible = true;
    }

    function hidePropertiesPanel() {
        const panel = document.getElementById('properties-panel');
        panel.style.display = 'none';
        propertiesPanelVisible = false;
    }

    function generatePropertiesContent() {
        if (selectedIndices.length === 0) return '<p>Nenhum objeto selecionado</p>';
        
        const obj = objectList[selectedIndices[0]];
        if (!obj) return '<p>Objeto inválido</p>';
        
        return `
            <div class="property-group">
                <div class="property-group-title">Transform</div>
                <div class="property-row">
                    <span class="property-label">Position X:</span>
                    <input type="number" class="property-input" value="${obj.position.x.toFixed(2)}" 
                           onchange="updateObjectProperty('position', 'x', this.value)">
                </div>
                <div class="property-row">
                    <span class="property-label">Position Y:</span>
                    <input type="number" class="property-input" value="${obj.position.y.toFixed(2)}" 
                           onchange="updateObjectProperty('position', 'y', this.value)">
                </div>
                <div class="property-row">
                    <span class="property-label">Position Z:</span>
                    <input type="number" class="property-input" value="${obj.position.z.toFixed(2)}" 
                           onchange="updateObjectProperty('position', 'z', this.value)">
                </div>
            </div>
            
            <div class="property-group">
                <div class="property-group-title">Rotation (Degrees)</div>
                <div class="property-row">
                    <span class="property-label">Rotation X:</span>
                    <input type="number" class="property-input" value="${(obj.rotation.x * 180 / Math.PI).toFixed(1)}" 
                           onchange="updateObjectProperty('rotation', 'x', this.value * Math.PI / 180)">
                </div>
                <div class="property-row">
                    <span class="property-label">Rotation Y:</span>
                    <input type="number" class="property-input" value="${(obj.rotation.y * 180 / Math.PI).toFixed(1)}" 
                           onchange="updateObjectProperty('rotation', 'y', this.value * Math.PI / 180)">
                </div>
                <div class="property-row">
                    <span class="property-label">Rotation Z:</span>
                    <input type="number" class="property-input" value="${(obj.rotation.z * 180 / Math.PI).toFixed(1)}" 
                           onchange="updateObjectProperty('rotation', 'z', this.value * Math.PI / 180)">
                </div>
            </div>
            
            <div class="property-group">
                <div class="property-group-title">Scale</div>
                <div class="property-row">
                    <span class="property-label">Scale X:</span>
                    <input type="number" class="property-input" value="${obj.scaling.x.toFixed(2)}" 
                           onchange="updateObjectProperty('scaling', 'x', this.value)">
                </div>
                <div class="property-row">
                    <span class="property-label">Scale Y:</span>
                    <input type="number" class="property-input" value="${obj.scaling.y.toFixed(2)}" 
                           onchange="updateObjectProperty('scaling', 'y', this.value)">
                </div>
                <div class="property-row">
                    <span class="property-label">Scale Z:</span>
                    <input type="number" class="property-input" value="${obj.scaling.z.toFixed(2)}" 
                           onchange="updateObjectProperty('scaling', 'z', this.value)">
                </div>
            </div>
            
            <div class="property-group">
                <div class="property-group-title">Visibility</div>
                <div class="property-row">
                    <span class="property-label">Visible:</span>
                    <input type="checkbox" class="property-checkbox" ${obj.isVisible ? 'checked' : ''} 
                           onchange="updateObjectProperty('isVisible', null, this.checked)">
                </div>
                <div class="property-row">
                    <span class="property-label">Pickable:</span>
                    <input type="checkbox" class="property-checkbox" ${obj.isPickable ? 'checked' : ''} 
                           onchange="updateObjectProperty('isPickable', null, this.checked)">
                </div>
            </div>
        `;
    }

    // Camera Bookmarks Functions
    function saveCameraBookmark() {
        const nameInput = document.getElementById('bookmark-name');
        const name = nameInput.value.trim();
        
        if (!name) {
            showToast('Digite um nome para o bookmark', 'warning');
            return;
        }
        
        const bookmark = {
            name: name,
            position: scene.activeCamera.position.clone(),
            target: scene.activeCamera.getTarget().clone(),
            timestamp: Date.now()
        };
        
        cameraBookmarks.push(bookmark);
        nameInput.value = '';
        updateBookmarksList();
        showToast(`Bookmark "${name}" salvo!`, 'success');
    }

    function loadCameraBookmark(index) {
        if (index < 0 || index >= cameraBookmarks.length) return;
        
        const bookmark = cameraBookmarks[index];
        const camera = scene.activeCamera;
        
        // Animação suave para a nova posição
        BABYLON.Animation.CreateAndStartAnimation(
            "cameraPosition", camera, "position", 30, 30,
            camera.position, bookmark.position, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        BABYLON.Animation.CreateAndStartAnimation(
            "cameraTarget", camera, "target", 30, 30,
            camera.getTarget(), bookmark.target, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        showToast(`Carregado: "${bookmark.name}"`, 'success');
    }

    function deleteCameraBookmark(index) {
        if (index < 0 || index >= cameraBookmarks.length) return;
        
        const name = cameraBookmarks[index].name;
        cameraBookmarks.splice(index, 1);
        updateBookmarksList();
        showToast(`Bookmark "${name}" removido`, 'success');
    }

    function updateBookmarksList() {
        const container = document.getElementById('bookmarks-list');
        if (!container) return;
        
        container.innerHTML = cameraBookmarks.map((bookmark, index) => `
            <div class="bookmark-item">
                <span class="bookmark-name">${bookmark.name}</span>
                <div class="bookmark-buttons">
                    <button class="bookmark-btn" onclick="loadCameraBookmark(${index})">Go</button>
                    <button class="bookmark-btn delete" onclick="deleteCameraBookmark(${index})">×</button>
                </div>
            </div>
        `).join('');
    }

    // Utility Functions
    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'block';
        
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    function updateObjectProperty(property, axis, value) {
        if (selectedIndices.length === 0) return;
        
        selectedIndices.forEach(index => {
            const obj = objectList[index];
            if (!obj) return;
            
            if (axis) {
                obj[property][axis] = parseFloat(value);
            } else {
                obj[property] = value;
            }
        });
        
        updateBottomBar();
    }

    function duplicateSelectedObjects() {
        if (selectedIndices.length === 0) {
            showToast('Nenhum objeto selecionado para duplicar', 'warning');
            return;
        }
        
        selectedIndices.forEach(index => {
            const originalObj = objectList[index];
            if (!originalObj) return;
            
            const newObj = originalObj.clone(originalObj.name + "_copy");
            newObj.position.x += 2;
            
            objectList.push(newObj);
        });
        
        updateObjectList();
        updateBottomBar();
        showToast(`${selectedIndices.length} objeto(s) duplicado(s)`, 'success');
    }

    function hideSelectedObjects() {
        if (selectedIndices.length === 0) return;
        
        selectedIndices.forEach(index => {
            const obj = objectList[index];
            if (obj) obj.setEnabled(false);
        });
        
        showToast(`${selectedIndices.length} objeto(s) ocultado(s)`, 'success');
    }

    function lockSelectedObjects() {
        if (selectedIndices.length === 0) return;
        
        selectedIndices.forEach(index => {
            const obj = objectList[index];
            if (obj) obj.isPickable = false;
        });
        
        showToast(`${selectedIndices.length} objeto(s) bloqueado(s)`, 'success');
    }

    function deleteSelectedObjects() {
        if (selectedIndices.length === 0) {
            showToast('Nenhum objeto selecionado para deletar', 'warning');
            return;
        }
        
        // Ordenar índices em ordem decrescente para remover corretamente
        const sortedIndices = [...selectedIndices].sort((a, b) => b - a);
        
        sortedIndices.forEach(index => {
            const obj = objectList[index];
            if (obj) {
                obj.dispose();
                objectList.splice(index, 1);
            }
        });
        
        selectedIndices = [];
        selectedIdx = null;
        if (gizmoManager) {
            gizmoManager.attachToMesh(null);
        }
        
        updateObjectList();
        updateBottomBar();
        showToast(`${sortedIndices.length} objeto(s) deletado(s)`, 'success');
    }

    // Event Listeners para Interface Avançada
    document.addEventListener('click', function(e) {
        // Fechar context menu ao clicar fora
        if (!e.target.closest('#context-menu')) {
            hideContextMenu();
        }
        
        // Fechar properties panel ao clicar fora
        if (!e.target.closest('#properties-panel') && !e.target.closest('[data-action="properties"]')) {
            if (propertiesPanelVisible && !e.target.closest('.btn')) {
                hidePropertiesPanel();
            }
        }
    });

    // Context menu no canvas
    canvas.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showContextMenu(e.clientX, e.clientY, 'canvas');
    });

    // Context menu items click
    document.addEventListener('click', function(e) {
        if (e.target.closest('.context-menu-item')) {
            const item = e.target.closest('.context-menu-item');
            if (!item.classList.contains('disabled')) {
                const action = item.getAttribute('data-action');
                handleContextMenuAction(action);
            }
        }
    });

    // Camera bookmarks button
    document.addEventListener('click', function(e) {
        if (e.target.id === 'save-bookmark') {
            saveCameraBookmark();
        }
    });

    // Expor funções globalmente para uso inline
    window.loadCameraBookmark = loadCameraBookmark;
    window.deleteCameraBookmark = deleteCameraBookmark;
    window.updateObjectProperty = updateObjectProperty;
    window.hidePropertiesPanel = hidePropertiesPanel;

    // ============================================================================
    // FASE 2: CRIAÇÃO AVANÇADA
    // ============================================================================

    // Array Tool Functions
    function showArrayTool() {
        if (selectedIndices.length === 0) {
            showToast('Selecione um objeto para usar o Array Tool', 'warning');
            return;
        }
        showModal('array-modal');
    }

    function executeArrayTool() {
        if (selectedIndices.length === 0) {
            hideModal('array-modal');
            return;
        }

        const count = parseInt(document.getElementById('array-count').value);
        const spacingX = parseFloat(document.getElementById('array-spacing-x').value);
        const spacingY = parseFloat(document.getElementById('array-spacing-y').value);
        const spacingZ = parseFloat(document.getElementById('array-spacing-z').value);

        selectedIndices.forEach(index => {
            const originalObj = objectList[index];
            if (!originalObj || !originalObj.mesh) return;

            // Criar cópias em array
            for (let i = 1; i < count; i++) {
                const newObj = originalObj.mesh.clone(originalObj.name + "_array_" + i);
                newObj.position.x = originalObj.mesh.position.x + (spacingX * i);
                newObj.position.y = originalObj.mesh.position.y + (spacingY * i);
                newObj.position.z = originalObj.mesh.position.z + (spacingZ * i);

                objectList.push({
                    name: newObj.name,
                    mesh: newObj,
                    type: originalObj.type,
                    selected: false,
                    visible: true,
                    locked: false,
                    layer: originalObj.layer,
                    props: { ...originalObj.props }
                });
            }
        });

        updateObjectList();
        updateBottomBar();
        hideModal('array-modal');
        showToast(`Array de ${count} objetos criado!`, 'success');
    }

    // Mirror Tool Functions
    function showMirrorTool() {
        if (selectedIndices.length === 0) {
            showToast('Selecione um objeto para usar o Mirror Tool', 'warning');
            return;
        }
        showModal('mirror-modal');
    }

    function executeMirrorTool() {
        if (selectedIndices.length === 0) {
            hideModal('mirror-modal');
            return;
        }

        const axis = document.querySelector('input[name="mirror-axis"]:checked').value;
        const removeOriginal = document.getElementById('mirror-remove-original').checked;

        const toRemove = [];
        selectedIndices.forEach(index => {
            const originalObj = objectList[index];
            if (!originalObj || !originalObj.mesh) return;

            // Criar objeto espelhado
            const newObj = originalObj.mesh.clone(originalObj.name + "_mirror");
            
            // Aplicar espelhamento baseado no eixo
            switch(axis) {
                case 'x':
                    newObj.position.x = -originalObj.mesh.position.x;
                    newObj.position.y = originalObj.mesh.position.y;
                    newObj.position.z = originalObj.mesh.position.z;
                    newObj.scaling.x = -newObj.scaling.x;
                    break;
                case 'y':
                    newObj.position.x = originalObj.mesh.position.x;
                    newObj.position.y = -originalObj.mesh.position.y;
                    newObj.position.z = originalObj.mesh.position.z;
                    newObj.scaling.y = -newObj.scaling.y;
                    break;
                case 'z':
                    newObj.position.x = originalObj.mesh.position.x;
                    newObj.position.y = originalObj.mesh.position.y;
                    newObj.position.z = -originalObj.mesh.position.z;
                    newObj.scaling.z = -newObj.scaling.z;
                    break;
            }

            objectList.push({
                name: newObj.name,
                mesh: newObj,
                type: originalObj.type,
                selected: false,
                visible: true,
                locked: false,
                layer: originalObj.layer,
                props: { ...originalObj.props }
            });

            if (removeOriginal) {
                toRemove.push(index);
            }
        });

        // Remover originais se solicitado
        if (removeOriginal) {
            toRemove.sort((a, b) => b - a); // Ordem decrescente
            toRemove.forEach(index => {
                const obj = objectList[index];
                if (obj && obj.mesh) {
                    obj.mesh.dispose();
                    objectList.splice(index, 1);
                }
            });
            
            selectedIndices = [];
            selectedIdx = null;
            if (gizmoManager) {
                gizmoManager.attachToMesh(null);
            }
        }

        updateObjectList();
        updateBottomBar();
        hideModal('mirror-modal');
        showToast(`Objeto(s) espelhado(s) no eixo ${axis.toUpperCase()}!`, 'success');
    }

    // CSG Operations Functions
    function performCSGUnion() {
        if (selectedIndices.length < 2) {
            showToast('Selecione pelo menos 2 objetos para operação CSG', 'warning');
            return;
        }

        const meshes = selectedIndices.map(i => objectList[i].mesh).filter(m => m && m.geometry);
        if (meshes.length < 2) {
            showToast('Objetos selecionados não são válidos para CSG', 'error');
            return;
        }

        try {
            let result = meshes[0];
            for (let i = 1; i < meshes.length; i++) {
                const csg1 = BABYLON.CSG.FromMesh(result);
                const csg2 = BABYLON.CSG.FromMesh(meshes[i]);
                const unionCSG = csg1.union(csg2);
                result = unionCSG.toMesh(result.name + "_union", result.material, scene);
                
                // Limpar mesh anterior se não for a primeira
                if (i > 1) {
                    const prevMesh = result;
                    result = unionCSG.toMesh(result.name + "_union", result.material, scene);
                    prevMesh.dispose();
                }
            }

            // Adicionar resultado à lista
            objectList.push({
                name: result.name,
                mesh: result,
                type: 'CSG Union',
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });

            // Remover objetos originais
            deleteSelectedObjects();
            showToast('União CSG realizada!', 'success');
        } catch (error) {
            showToast('Erro na operação CSG: ' + error.message, 'error');
        }
    }

    function performCSGSubtract() {
        if (selectedIndices.length !== 2) {
            showToast('Selecione exatamente 2 objetos para subtração CSG', 'warning');
            return;
        }

        const mesh1 = objectList[selectedIndices[0]].mesh;
        const mesh2 = objectList[selectedIndices[1]].mesh;

        if (!mesh1 || !mesh2 || !mesh1.geometry || !mesh2.geometry) {
            showToast('Objetos selecionados não são válidos para CSG', 'error');
            return;
        }

        try {
            const csg1 = BABYLON.CSG.FromMesh(mesh1);
            const csg2 = BABYLON.CSG.FromMesh(mesh2);
            const subtractCSG = csg1.subtract(csg2);
            const result = subtractCSG.toMesh(mesh1.name + "_subtract", mesh1.material, scene);

            objectList.push({
                name: result.name,
                mesh: result,
                type: 'CSG Subtract',
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });

            deleteSelectedObjects();
            showToast('Subtração CSG realizada!', 'success');
        } catch (error) {
            showToast('Erro na operação CSG: ' + error.message, 'error');
        }
    }

    function performCSGIntersect() {
        if (selectedIndices.length !== 2) {
            showToast('Selecione exatamente 2 objetos para interseção CSG', 'warning');
            return;
        }

        const mesh1 = objectList[selectedIndices[0]].mesh;
        const mesh2 = objectList[selectedIndices[1]].mesh;

        if (!mesh1 || !mesh2 || !mesh1.geometry || !mesh2.geometry) {
            showToast('Objetos selecionados não são válidos para CSG', 'error');
            return;
        }

        try {
            const csg1 = BABYLON.CSG.FromMesh(mesh1);
            const csg2 = BABYLON.CSG.FromMesh(mesh2);
            const intersectCSG = csg1.intersect(csg2);
            const result = intersectCSG.toMesh(mesh1.name + "_intersect", mesh1.material, scene);

            objectList.push({
                name: result.name,
                mesh: result,
                type: 'CSG Intersect',
                selected: false,
                visible: true,
                locked: false,
                layer: 'geometry',
                props: { movel: false, perigo: false, plataforma: false, decorativo: true }
            });

            deleteSelectedObjects();
            showToast('Interseção CSG realizada!', 'success');
        } catch (error) {
            showToast('Erro na operação CSG: ' + error.message, 'error');
        }
    }

    // Modal Functions
    function showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    function hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Event Listeners para Criação Avançada
    document.addEventListener('click', function(e) {
        // Array Tool
        if (e.target.id === 'array-tool') {
            showArrayTool();
        }
        
        // Mirror Tool
        if (e.target.id === 'mirror-tool') {
            showMirrorTool();
        }
        
        // CSG Operations
        if (e.target.id === 'csg-union') {
            performCSGUnion();
        }
        
        if (e.target.id === 'csg-subtract') {
            performCSGSubtract();
        }
        
        if (e.target.id === 'csg-intersect') {
            performCSGIntersect();
        }
    });

    // Expor funções globalmente para uso inline nos modais
    window.executeArrayTool = executeArrayTool;
    window.executeMirrorTool = executeMirrorTool;
    window.showModal = showModal;
    window.hideModal = hideModal;
    
    console.log('Editor 3D inicializado com sucesso');
});
