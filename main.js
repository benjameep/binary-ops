const svg = d3.select('svg')
const clip = svg.append('clipPath').attr('id','clip').append('rect')
const $nodes = svg.append('g').classed('nodes',true).attr('clip-path','url(#clip)')
const $labels = svg.append('g').classed('labels',true)
const $hover = svg.append('g').classed('hover',true)

const blocksize = 60
const margin = 100
const btns = ['!','~','<<','>>','+','&','|','^']
const numnodes = 8
const rows = Array(2).fill().map((_,r) => Array(numnodes).fill().map((_,c) => new Bit(r*numnodes+c,r,c)))
const nodes = [].concat(...rows)

const x = scale()
  .bandwidth(blocksize)
  .paddingInner(3)
  .paddingOuter(20)
  .anchor(0)
  .align(0.5)
  .count(numnodes)
  
const y = scale()
  .bandwidth(blocksize)
  .paddingInner(blocksize/2)
  .paddingOuter(10)
  .count(2)

const btnx = scale()
  .bandwidth(blocksize)
  .paddingInner(3)
  .align(0.5)
  .anchor(x.min()+x.size()/2)
  .count(btns.length)

const btny = scale()
  .bandwidth(blocksize)
  .anchor(y.min()+y.size()/2)
  .paddingInner(y.size())
  .align(0.5)
  .count(2)

const transform = d3.transform()
  .translate(d => [x(d.c)+x.bandwidth()/2,y(d.r)+y.bandwidth()/2])

/* Adjust the container dimensions */
svg.attr('viewBox',[x.min()-margin,btny.min(),x.size()+margin*2,btny.size()].join(' '))
  .attr('width',700)
  .attr('height',btny.size())

clip
  .attr('x',x.min()+x.paddingOuter())
  .attr('y',y.min())
  .attr('width',x.size()-x.paddingOuter()*2)
  .attr('height',y.size())

function animateflip(selection,cb=()=>{}){
  selection.filter(function(d){
    return d3.select(this).classed('on') != d.get()
  }).transition()
    .duration(100)
    .attr('transform',d3.transform(transform).scale(1,0))
    .on('end',cb)
  .transition()
    .duration(100)
    .attr('transform',transform)
}

function animateShift(selection,shift,cb){
  tempnode.c = shift == -1 ? numnodes : -1
  tempnode.r = selection.datum().r
  d3.select('#temp')
    .attr('visibility','visible')
    .attr('transform',transform)

  selection.transition()
    .attr('transform',d3.transform(transform).translate(shift*(x.bandwidth()+x.paddingInner()),0))
    .on('end',() => {
      d3.select('#temp').attr('visibility','hidden')
      cb()
    })
  .transition()
    .duration(0)
    .attr('transform',transform)
}

function animateReplace(selection,cb){
  const _hover = $hover.selectAll('use').data(selection.data())
  _hover.exit().remove()
  _hover.enter().append('use')
    .merge(_hover)
    .attr('href',d => '#'+d.id)
  .transition()
    .attr('transform',d3.transform().translate(d => [0,-1*(d.r*2-1)*(y.paddingInner()+y.bandwidth())]))
    .on('end',cb)
    .remove()
}

/* Nodes */
const tempnode = new Bit('temp',0,)
$nodes.selectAll('g').data(nodes.concat(tempnode))
  .enter().append('g')
  .attr('visibility', d => d.id!='temp' ? 'visible' : 'hidden')
  .attr('id',d => d.id)
  .each(function(){
    var g = d3.select(this)
    g.append('circle')
      .attr('r',x.bandwidth()/2)
    g.append('text')
      .text(d => d.get())
  })
  .filter(d => d.id != 'temp')
  .attr('data-row',d => d.r)
  .attr('transform',transform)
  .on('click',function(bit){
    bit.flip()
    d3.select(this).call(animateflip,update) 
  })
  
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
  var $row = d3.selectAll(`[data-row="${r}"],#temp`)
  var row = rows[r]
  var $other = d3.selectAll(`[data-row="${(r+1)%2}"],#temp`)
  var other = rows[(r+1)%2]

  switch(op){
  case '&':
    row.forEach((bit,i) => bit.set(bit.get() & other[i].get()))
    $other.filter(d => !d.get()).call(animateReplace,update)
    break;
  case '|':
    row.forEach((bit,i) => bit.set(bit.get() | other[i].get()))
    $other.filter(d => d.get()).call(animateReplace,update)
    break;
  case '^':
    row.forEach((bit,i) => bit.set(bit.get() ^ other[i].get()))
    $other.filter(d => d.get()).call(animateReplace,() => $row.call(animateflip,update))
    break;
  case '!':
    row.forEach(bit => bit.flip())
    $row.call(animateflip,update)
    break;
  case '~':
    row.forEach(bit => bit.flip())
    add1(row)
    $row.call(animateflip,update)
    break;
  case '<<':
    row.reduceRight((carry,bit) => bit.set(carry),0)
    $row.call(animateShift,-1,update)
    break;
  case '>>':
    row.reduce((carry,bit) => bit.set(carry),0)
    $row.call(animateShift,1,update)
    break;
  case '+':
    add1(row)
    $row.call(animateflip,update)
    break;
  }
}

update()