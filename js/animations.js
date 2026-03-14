export function glitchEffect(element){

const tl = gsap.timeline();

tl.to(element,{
x:3,
duration:0.05
})

.to(element,{
x:-3,
duration:0.05
})

.to(element,{
skewX:20,
duration:0.06,
repeat:4,
yoyo:true
})

.to(element,{
x:0,
skewX:0,
duration:0.1
});

}