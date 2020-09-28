/**
 * @module helpers/grid
 */


const helpersGrid = (three = window.THREE) => {
  if (three === undefined || three.Object3D === undefined) {
    return null;
  }

  const Constructor = three.Object3D;
  return class extends Constructor {
    constructor(
      stack,
      slice,
      index = slice.index,
      position = slice.position,
      direction = slice.direction,
      aabbSpace = 'IJK') {
      //
      super();

      this._stack = stack;
      this._slice = slice;

      this._gridVisible = false;
      this._material = null;
      this._geometry = null;
      this._mesh = null;
      this._index = index;
      this._planePosition = position;
      this._planeDirection = direction;
      this._aaBBspace = aabbSpace;
      this._rows = 0;
      this._columns = 0;
      this._halfDimensions = null;

      this._init();

      this._create();
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
    }

    get slice() {
      return this._slice;
    }

    set gridVisible(gridVisible) {
      this._gridVisible = gridVisible;
      if (this._mesh) {
        this._mesh.visible = this._gridVisible;
      }
      this._update();
    }

    get gridVisible() {
      return this._gridVisible;
    }

    set color(color) {
      this._color = color;
      if (this._material) {
        this._material.color.set(this._color);
      }
    }

    get color() {
      return this._color;
    }

    get index() {
      return this._index;
    }

    get rows() {
      return this._rows;
    }

    set rows(rows) {
      this._rows = rows;
    }

    get columns() {
      return this._columns;
    }

    set columns(columns) {
      this._columns = columns;
    }

    set index(index) {
      this._index = index;
      this._update();
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
    
    set aabbSpace(aabbSpace) {
      this._aaBBspace = aabbSpace;
      this._init();
    }

    get aabbSpace() {
      return this._aaBBspace;
    }

    set mesh(mesh) {
      this._mesh = mesh;
    }

    get mesh() {
      return this._mesh;
    }

    set material(material) {
      this._material = material;
      this._update();
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

    set halfDimensions(halfDimensions) {
      this._halfDimensions = halfDimensions;
    }

    get halfDimensions() {
      return this._halfDimensions;
    }

    set center(center) {
      this._center = center;
    }

    get center() {
      return this._center;
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
    }



    _create() {
      if (!this._stack || !this._stack.prepared || !this._stack.packed || !this._gridVisible) {
        return;
      }

      const color1 = new three.Color( color1 !== undefined ? color1 : 0x444444 );
      const color2 = new three.Color( color2 !== undefined ? color2 : 0x888888 );


      const vertices = [], colors = [];
      const sizes = {x: this._halfDimensions.x * 2, y: this._halfDimensions.y * 2};
      const counts = {x: this._halfDimensions.x * 2, y: this._halfDimensions.y * 2};

      const centerX = sizes.x / 2;
      const centerY = sizes.y / 2;

      const step = sizes.x / counts.x;

      for (let i = 0, j = 0, y = 0; i <= counts.y; i++, y += step) {
        vertices.push(0, y, 0, sizes.x, y, 0);
        
        const color = i === centerY ? color1 : color2;
        
        color.toArray( colors, j); j += 3;
        color.toArray( colors, j); j += 3;
      }

      for (let i = 0, j = 6 * (counts.y + 1), x = 0; i <= counts.x; i++, x += step) {
        vertices.push(x, 0, 0, x, sizes.y, 0);
        
        const color = i === centerX ? color1 : color2;
        
        color.toArray( colors, j); j += 3;
        color.toArray( colors, j); j += 3;
      }

      this._geometry = new three.BufferGeometry();
      this._geometry.setAttribute('position', new three.Float32BufferAttribute(vertices, 3));
      this._geometry.setAttribute('color', new three.Float32BufferAttribute(colors, 3));

      this._material = new three.LineBasicMaterial( {vertexColors: true, toneMapped: false});

      this._mesh = new three.LineSegments(this._geometry, this._material);

      this._mesh.applyMatrix4(new three.Matrix4().makeTranslation(- 0.5,- 0.5, this._index - 0.5));

      if (this._aaBBspace === 'IJK') {
        this._mesh.applyMatrix4(this._stack.ijk2LPS);
      };

      this.add(this._mesh);
    }


    _update() {
        // update slice
      if (this._mesh) {
        this.remove(this._mesh);
        this._mesh.geometry.dispose();
        this._mesh = null;
      }

      this._create();
    }

    dispose() {
      this._mesh.material.dispose();
      this._mesh.material = null;
      this._geometry.dispose();
      this._geometry = null;
      this._material.dispose();
      this._material = null;
    }
  };
};

// export factory
export { helpersGrid };
// default export to
export default helpersGrid();