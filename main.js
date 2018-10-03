const svg = d3.select('svg')
const $nodes = svg.append('g').classed('nodes',true)
const $labels = svg.append('g').classed('labels',true)

const margin = {left:120,right:0}
const blocksize = 60

class Bit {
  constructor(r=0,c=0,val=Math.floor(Math.random()*2)){
    this._value = (Number(val)||0)%2
    this._r = r
    this._c = c
  }
  get r(){ return this._r }
  get c(){ return this._c }
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

const x = scale()
  .bandwidth(blocksize)
  .paddingInner(3)
  .paddingOuter(20)
  .anchor(margin.left)
  
const y = scale()
  .bandwidth(blocksize)
  .paddingInner(blocksize/2)
  .paddingOuter(10)
  .count(2)

const btnx = scale()
  .bandwidth(blocksize)
  .paddingInner(3)
  .align(0.5)

const btny = scale()
  .bandwidth(blocksize)
  .anchor(y.min()+y.size()/2)
  .paddingInner(y.size())
  .align(0.5)
  .count(2)

const btns = ['!','~','<<','>>','+','&','|','^']
const numnodes = 8
x.count(numnodes)
btnx.anchor(x.min()+x.size()/2)
btnx.count(btns.length)
const rows = Array(2).fill().map((_,r) => Array(numnodes).fill().map((_,c) => new Bit(r,c,0)))
const nodes = [].concat(...rows)

/* Adjust the container dimensions */
svg.attr('viewBox',[0,btny.min(),margin.left+x.size()+margin.right,btny.size()].join(' '))
  .attr('width',700)
  .attr('height',btny.size())

/* Nodes */
$nodes.selectAll('g').data(nodes)
  .enter().append('g')
  .attr('transform',d => `translate(${[x(d.c)+x.bandwidth()/2,y(d.r)+y.bandwidth()/2]})`)
  .each(function(){
    var g = d3.select(this)
    g.append('circle')
      .attr('r',x.bandwidth()/2)
    g.append('text')
      .text(d => d.get())
  })
  .on('click',bit => {bit.flip(); update()})
  
/* Hex Labels */
$labels.selectAll('.hex').data(rows)
  .enter().append('text').classed('hex',true)
  .attr('y',(_,i) => y(i) + y.bandwidth()/2)
  .attr('x',x.min())

/* Buttons */
$labels.selectAll('g').data(rows)
  .enter().append('g')
  .attr('transform',(d,i) => `translate(${[0,btny(i)]})`)
  .each(function(_,r){
    d3.select(this).selectAll('.btn').data(btns)
      .enter().append('g').classed('btn',true)
      .attr('transform',(d,c) => `translate(${[btnx(c) + x.bandwidth()/2,y.bandwidth()/2]})`)
      .each(function(){
        var g = d3.select(this)
        g.append('circle')
          .attr('r',x.bandwidth()/2)
        g.append('text')
          .text(d => d)
      })
      .on('click',d => operation(d,r))
  })
  
function update(){
  $nodes.selectAll('g').data(nodes)
    .classed('on',d => d.get())
    .each(function(){
      var g = d3.select(this)
      g.select('text')
        .text(d => d.get())
    })
    
  $labels.selectAll('text').data(rows)
    .text(row => '0x'+parseInt(row.join(''),2).toString(16).toUpperCase().padStart(2,0))
}

function add1(row){
  row.reduceRight((carry,bit) => bit.set(bit ^ carry) & carry,1)
}

function operation(op,r){
  var row = rows[r]
  var other = rows[(r+1)%2]

  switch(op){
  case '&':
    row.forEach((bit,i) => bit.set(bit.get() & other[i].get()))
    break;
  case '|':
    row.forEach((bit,i) => bit.set(bit.get() | other[i].get()))
    break;
  case '^':
    row.forEach((bit,i) => bit.set(bit.get() ^ other[i].get()))
    break;
  case '!':
    row.forEach(bit => bit.flip())
    break;
  case '~':
    row.forEach(bit => bit.flip())
    add1(row)
    break;
  case '<<':
    row.reduceRight((carry,bit) => bit.set(carry),0)
    break;
  case '>>':
    row.reduce((carry,bit) => bit.set(carry),0)
    break;
  case '+':
    add1(row)
    break;
  }
  update()
}

update()