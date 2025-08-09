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

    // Função para atualizar campos da bottom bar
    function updateBottomBar() {
        const selectedEl = document.getElementById('selected-count');
        const objsEl = document.getElementById('objects-count');
        const modeEl = document.getElementById('gizmo-mode');
        
        if (selectedEl) selectedEl.textContent = selectedIndices.length;
        if (objsEl) objsEl.textContent = objectList.length;
        if (modeEl) modeEl.textContent = gizmoMode === 'move' ? 'Move' : 
                                      gizmoMode === 'rotate' ? 'Rotate' : 'Scale';
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

    // Clique na cena para desselecionar
    scene.onPointerObservable.add(function(pointerInfo) {
        if (pointerInfo.pickInfo.hit && pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
            const pickedMesh = pointerInfo.pickInfo.pickedMesh;
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
                    <button onclick="delete selectionSets['${name}']; updateSelectionSetsUI();" style="background:none;border:none;color:#ff6b6b;">✖</button>
                `;
                container.appendChild(div);
            });
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
    
    console.log('Editor 3D inicializado com sucesso');
});
