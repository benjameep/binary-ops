class Bit {
  constructor(id,r=0,c=0){
    this._value = 0
    this.r = r
    this.c = c
    this.id = id
  }
  flip(){
    this._value = +!this._value
    return this._value
  }
  get(){ return this._value }
  set(val){ 
    var temp = this._value
    this._value = (Number(val)||0)%2 
    return temp
  }
  toString(){ return this._value }
}