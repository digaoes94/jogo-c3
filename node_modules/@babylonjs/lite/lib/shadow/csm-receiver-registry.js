// src/shadow/csm-receiver-registry.ts
var _stdFactory = null;
/** Register the Standard-material CSM receiver fragment factory. Called by the CSM generator. */
function setCsmStdReceiverFactory(f) {
	_stdFactory = f;
}
/** Get the registered Standard-material CSM receiver fragment factory, or `null` if no CSM generator was created. */
function getCsmStdReceiverFactory() {
	return _stdFactory;
}
var _pbrFactory = null;
/** Register the PBR-material CSM receiver fragment factory. Called by the CSM generator. */
function setCsmPbrReceiverFactory(f) {
	_pbrFactory = f;
}
/** Get the registered PBR-material CSM receiver fragment factory, or `null` if no CSM generator was created. */
function getCsmPbrReceiverFactory() {
	return _pbrFactory;
}
export { getCsmPbrReceiverFactory, getCsmStdReceiverFactory, setCsmPbrReceiverFactory, setCsmStdReceiverFactory };

//# sourceMappingURL=csm-receiver-registry.js.map