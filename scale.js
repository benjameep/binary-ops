function scale(){
  let count = 0
  let bandwidth = 0
  let paddingInner = 0
  let paddingOuter = 0
  let align = 0
  let anchor = 0
  function position(i){
    return anchor + -position.size()*align + paddingOuter + i*(bandwidth+paddingInner)
  }
  position.size = () => paddingOuter*2 + bandwidth*count + paddingInner*(count-1)
  position.min = () => anchor + -position.size()*align
  position.max = () => anchor + position.size()*(1-align)
  position.count = function(_){ return arguments.length ? (count=_,position) : count}  
  position.bandwidth = function(_){ return arguments.length ? (bandwidth=_,position) : bandwidth}
  position.paddingInner = function(_){ return arguments.length ? (paddingInner=_,position) : paddingInner}
  position.paddingOuter = function(_){ return arguments.length ? (paddingOuter=_,position) : paddingOuter}
  position.padding = function(_){ return paddingInner=paddingOuter=_,position}
  position.align = function(_){ return arguments.length ? (align=_,position) : align}
  position.anchor = function(_){ return arguments.length ? (anchor=_,position) : anchor}
  return position
}