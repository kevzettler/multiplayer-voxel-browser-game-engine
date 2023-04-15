export default function fastActionCreatorFactory(type){
  function actionCreator(payload){
    return {
      type,
      payload
    }
  }

  actionCreator.type = type;
  actionCreator.toString = function(){return this.type;};
  return actionCreator;
}
