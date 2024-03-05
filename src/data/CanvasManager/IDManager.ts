export default class IDManager {
  static id = 1;
  static getID() {
    return this.id++;
  }
}
