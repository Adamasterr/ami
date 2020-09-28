/**
 * @module helpers/selector
 */


const helpersSelector = (three = window.THREE) => {
  if (three === undefined || three.Object3D === undefined) {
    return null;
  }

  const Constructor = three.Object3D;
  return class extends Constructor {
    constructor(
      stack,
      slice,
      camera,
      index = slice.index,
      position = slice.position,
      direction = slice.direction,
      aabbSpace = 'IJK') {
      //
      super();

      this._stack = stack;
      this._slice = slice;
      this._camera = camera;
      this._index = index;

      this._aaBBspace = aabbSpace;
      this._halfDimensions = null;
      this._planePosition = position;
      this._planeDirection = direction;


      this._selectorToggle = false;

      this._raycaster = null;
      this._mouse = null;
      this._point = null;

      this._shiftPressed = false;

      this._material = null;
      this._geometry = null;
      this._selectorMaterial = null;
      this._selectorGeometry = null;

      this._mesh = null;

      this._selectorMesh = null;

      this._memory = [];


      this._init();

      this._create();
      this._createSelector();

      this._raycast();
    }

    set halfDimensions(halfDimensions) {
      this._halfDimensions = halfDimensions;
    }

    get halfDimensions() {
      return this._halfDimensions;
    }

    /**
     * @param {number} index
     */
    set index(index) {
      // debugger;
      this._index = index;
      this._update();
      this._selectorUpdate();
    }


    set planePosition(position) {
      this._planePosition = position;
      this._update();
    }

    get planePosition() {
      return this._planePosition;
    }

    set planeDirection(direction) {
      this._planeDirection = direction;
      this._update();
    }

    get planeDirection() {
      return this._planeDirection;
    }

    /**
     * @param {string} aabbSpace
     */
    set aabbSpace(aabbSpace) {
      this._aaBBspace = aabbSpace;
      this._init();
    }

    set point(point) {
      this._point = point;
    }

    get point() {
      return this._point;
    }

    set mouse(mouse) {
      this._mouse = mouse;
    }

    get mouse() {
      return this._mouse;
    }

    set raycaster(raycaster) {
      this._raycaster = raycaster;
    }

    get raycaster() {
      return this._raycaster;
    }

    set camera(camera) {
      this._camera = camera;
    }

    get camera() {
      return this._camera;
    }

    set stack(stack) {
      this._stack = stack;
      this._update();
    }

    get stack() {
      return this._stack;
    }

    set slice(slice) {
      this._slice = slice;
      this._update();
      this._selectorUpdate();
    }

    get slice() {
      return this._slice;
    }

    set selectorToggle(value) {
      this._selectorToggle = value;
      if (this._selectorMesh) {
        this._selectorMesh.visible = this._selectorToggle;
      }
      if (this._mesh) {
        this._mesh.visible = this._selectorToggle;
      }
      this._update();
      this._selectorUpdate();
    }

    get selectorToggle() {
      return this._selectorToggle;
    }

    set material(material) {
      this._material = material;
    }

    get material() {
      return this._material;
    }

    set geometry(geometry) {
      this._geometry = geometry;
    }

    get geometry() {
      return this._geometry;
    }

    set selectorMaterial(selectorMaterial) {
      this._selectorMaterial = selectorMaterial;
    }

    get selectorMaterial() {
      return this._selectorMaterial;
    }

    set selectorGeometry(selectorGeometry) {
      this._selectorGeometry = selectorGeometry;
    }

    get selectorGeometry() {
      return this._selectorGeometry;
    }

    set mesh(mesh) {
      this._mesh = mesh;
    }

    get mesh() {
      return this._mesh;
    }

    set selectorMesh(selectorMesh) {
      this._selectorMesh = selectorMesh;
    }

    get selectorMesh() {
      return this._selectorMesh;
    }


    _init() {
      if (!this._stack || !this._stack._prepared || !this._stack._packed) {
        return;
      }

      if (this._aaBBspace === 'IJK') {
        this._halfDimensions = this._stack.halfDimensionsIJK;
        this._center = new three.Vector3(
          this._stack.halfDimensionsIJK.x - 0.5,
          this._stack.halfDimensionsIJK.y - 0.5,
          this._stack.halfDimensionsIJK.z - 0.5
        );
        this._toAABB = new three.Matrix4();
      } else {
        // LPS
        let aaBBox = this._stack.AABBox();
        this._halfDimensions = aaBBox.clone().multiplyScalar(0.5);
        this._center = this._stack.centerAABBox();
        this._toAABB = this._stack.lps2AABB;
      }

      this._raycaster = new three.Raycaster();
      this._mouse = new three.Vector2();
    }



    _create() {
      if (!this._stack || !this._stack.prepared || !this._stack.packed || !this._selectorToggle) {
        return;
      }

      this._geometry = new three.PlaneBufferGeometry(1, 1, 1, 1);
      this._material = new three.MeshBasicMaterial({ color: 0x00ff00, side: three.BackSide, transparent: true, opacity: 0.7 });

      if (this._memory.length > 0) {
        // this will not work for different orientations
        // needs to be replaced with a better logic
        const currentLayer = this._memory.filter(({ x, y, z }) => z === this._index);
        if (currentLayer.length > 0) {
          this._mesh = new three.InstancedMesh(this._geometry, this._material, currentLayer.length);
          for (let i = 0; i < currentLayer.length; i++) {
            this._mesh.setMatrixAt(i, new three.Matrix4().makeTranslation(currentLayer[i].x, currentLayer[i].y, currentLayer[i].z - 0.5));
          }
          if (this._aaBBspace === 'IJK') {
            this._mesh.applyMatrix4(this._stack.ijk2LPS);
          }
  
          this.add(this._mesh);
        }
      }


    }

    _createSelector() {
      if (!this._stack || !this._stack.prepared || !this._stack.packed || !this._selectorToggle || !this._point) {
        return;
      }
      this._selectorGeometry = new three.PlaneBufferGeometry(1, 1, 1, 1);
      this._selectorMaterial = new three.MeshBasicMaterial({ color: 0x00ff00, side: three.BackSide, transparent: true, opacity: 0.4})
      this._selectorMesh = new three.Mesh(this._selectorGeometry, this._selectorMaterial);
      this._selectorMesh.applyMatrix4(new three.Matrix4().makeTranslation(this._point.x, this._point.y, this._index - 0.5));

      if (this._aaBBspace === 'IJK') {
        this._selectorMesh.applyMatrix4(this._stack.ijk2LPS);
      }


      this.add(this._selectorMesh);
    }

    mousemove(event) {
      if (!this._selectorToggle) {
        return;
      }
      event.preventDefault();
      this._mouse.set((event.clientX / window.innerWidth) * 2 - 1, - (event.clientY / window.innerHeight) * 2 + 1);
      this._raycaster.setFromCamera(this._mouse, this._camera);

      const intersects = this._raycaster.intersectObject(this._slice.mesh);

      if (intersects.length > 0) {
        const intersect = intersects[0];

        let point = intersect.point;
        point.applyMatrix4(this._stack.lps2IJK);
        point.set(Math.floor(point.x + 0.5), Math.floor(point.y + 0.5), Math.floor(point.z + 0.5));

        if (!this._point || this._point.x !== point.x || this._point.y !== point.y) {
          this._point = point;
          this._selectorUpdate();

          console.log(this._point);

        }
      }
      else {
        this._point = null;
      }

    }

    keydown(event) {
      if (event.keyCode == 16) {
        this._shiftPressed = true;
      }
    }

    keyup(event) {
      if (event.keyCode == 16) {
        this._shiftPressed = false;
      }
    }

    mousedown(event) {
      if (event.button == 0 && this._shiftPressed) {
        if (this._point && !this._memory.some(({ x, y, z }) => {
          return x === this._point.x && y === this._point.y && z === this._point.z;
        })) {
          this._memory.push(this._point);
          console.log(this._memory);
          this._update();
        }
      }
    }

    _raycast() {
      document.addEventListener('mousemove', (event) => this.mousemove(event), false);
      document.addEventListener('mousedown', (event) => this.mousedown(event), false);
      document.addEventListener('keydown', (event) => this.keydown(event), false);
      document.addEventListener('keyup', (event) => this.keyup(event), false);
    }


    _update() {
      if (this._mesh) {
        this.remove(this._mesh);
        this._mesh.geometry.dispose();
        this._mesh = null;
      }

      this._create();
    }

    _selectorUpdate() {
      if (this._selectorMesh) {
        this.remove(this._selectorMesh);
        this._selectorMesh.geometry.dispose();
        this._selectorMesh = null;
      }

      this._createSelector();
    }

    dispose() {
      this._mesh.material.dispose();
      this._mesh.material = null;
      this._geometry.dispose();
      this._geometry = null;
      this._material.dispose();
      this._material = null;
      this._selectorGeometry.dispose();
      this._selectorMaterial = null;
      this._selectorMesh = null;
    }
  };
};

// export factory
export { helpersSelector };
// default export to
export default helpersSelector();