/** Runtime material sampling from the existing Osiris atlas, not a new image.
 * Only an opaque interior skin patch is sampled. The source PNG is untouched.
 */
export async function loadQuadrupedSkin(THREE){
 const color=await new THREE.TextureLoader().loadAsync(new URL('./osiris-rig-parts-v1.png',import.meta.url).href);
 color.colorSpace=THREE.SRGBColorSpace;
 color.offset.set(220/1448,1-185/1086);color.repeat.set(110/1448,100/1086);
 color.wrapS=color.wrapT=THREE.ClampToEdgeWrapping;
 color.anisotropy=2;color.needsUpdate=true;
 const bump=color.clone();bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
 return {color,bump,source:'osiris-rig-parts-v1.png',rect:[220,85,110,100],dispose(){color.dispose();bump.dispose();}};
}
