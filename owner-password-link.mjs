// Adds a SITE password to an existing verified Google identity; never signs up or merges accounts.
export async function linkVerifiedGooglePassword({password,confirmation,expectedEmail,getSession,lookup,verifyOwner,update,save}){
 if(typeof password!=='string'||password.length<12||password.length>128||password!==confirmation)throw Error('PASSWORD_CONFIRMATION_REQUIRED');
 const session=getSession();if(!session?.idToken||session.emailVerified!==true||session.email?.toLowerCase()!==expectedEmail.toLowerCase())throw Error('OWNER_SIGN_IN_REQUIRED');
 const current=()=>getSession()?.idToken===session.idToken&&getSession()?.email===session.email;
 const profile=await lookup(session.idToken);if(!current())throw Error('STALE_SESSION');
 if(!profile?.localId||profile.disabled||profile.emailVerified!==true||profile.email?.toLowerCase()!==expectedEmail.toLowerCase())throw Error('OWNER_SIGN_IN_REQUIRED');
 const providers=profile.providerUserInfo?.map(x=>x.providerId)||[];
 if(!providers.includes('google.com'))throw Error('GOOGLE_SIGN_IN_REQUIRED');
 if(providers.includes('password'))throw Error('PASSWORD_ALREADY_LINKED');
 if(await verifyOwner()!==true)throw Error('OWNER_REQUIRED');if(!current())throw Error('STALE_SESSION');
 try{
 const result=await update({idToken:session.idToken,email:profile.email,password,returnSecureToken:true});
 if(!current())throw Error('STALE_SESSION');
 if(result.localId!==profile.localId||result.email!==profile.email||!result.idToken||!result.refreshToken)throw Error('IDENTITY_MISMATCH');
 const verified=await lookup(result.idToken);if(!current())throw Error('STALE_SESSION');
 if(verified?.localId!==profile.localId||verified.email!==profile.email||!verified.emailVerified||verified.disabled||!verified.providerUserInfo?.some(x=>x.providerId==='google.com')||!verified.providerUserInfo?.some(x=>x.providerId==='password'))throw Error('LINK_NOT_CONFIRMED');
 save({...session,idToken:result.idToken,refreshToken:result.refreshToken,expiresAt:Date.now()+Number(result.expiresIn||3600)*1000,emailVerified:true});
 return {sameAccount:true};
 }catch(error){if(error?.message==='CREDENTIAL_TOO_OLD_LOGIN_AGAIN')throw error;throw Object.assign(Error('LINK_OUTCOME_UNKNOWN'),{mayHaveChanged:true});}
}
