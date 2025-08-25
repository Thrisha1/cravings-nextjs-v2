
// polyfills.ts
if (typeof (window as any).WeakRef === "undefined") {
  (window as any).WeakRef = class {
    private _value: any;
    constructor(value: any) { this._value = value; }
    deref() { return this._value; }
  };
}

if (!("randomUUID" in crypto)) {
  (crypto as any).randomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
}
