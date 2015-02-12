/*global Arenite:true*/
Arenite.SubDemo = function () {
  return {
    context: {
      instances: {
        subEcho: {
          namespace: 'Arenite.Echo',
          args: [{value: 'sub-echo'}]
        }
      }
    }
  };
};