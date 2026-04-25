// react-native-mmkv stub
export class MMKV {
  private store: Record<string, string> = {};
  getString(key: string)             { return this.store[key]; }
  set(key: string, value: string)    { this.store[key] = value; }
  delete(key: string)                { delete this.store[key]; }
}
