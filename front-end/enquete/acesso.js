var OpSim=0, OpNao=0,cont=0;
var resp=0, Sim=0, Nao=0, reg=0;



function Buscar_Dados(){
  $.getJSON( "http://dca.telefonicabeta.com/m2m/v2/services/kitkitiot4G_a29df5ad/assets/kit-iot-4g/", function( resp ) {
      OpSim=resp.data.sensorData[2].ms.v;
      OpNao=resp.data.sensorData[3].ms.v;
      OpSim = parseInt(OpSim);
      OpNao = parseInt(OpNao);
      if(OpSim==0 && OpNao==0){
        $("#resultSim").html(parseFloat(0).toFixed(2)+"%");
        $("#resultNao").html(parseFloat(0).toFixed(2)+"%");
      }
      else{
        $("#resultSim").html(parseFloat((OpSim/(OpSim+OpNao)*100)).toFixed(2)+"%");
        $("#resultNao").html(parseFloat((OpNao/(OpSim+OpNao)*100)).toFixed(2)+"%");

        document.getElementById("totalalunos").innerHTML=OpSim+OpNao;
      }

  });
}

$(document).ready(function(){
  setInterval(Buscar_Dados, 500);
});

function Gravar(){
  resp=document.getElementById("perguntabox").value;
  document.getElementById("perguntabox").value="";
  if(!resp==""){
    Sim=document.getElementById("resultSim").innerHTML;
    Nao=document.getElementById("resultNao").innerHTML;
    $("#tab_results > tbody:last").append('<tr><td class="col-md-3 text-center">'+resp+'</td><td class="col-md-3 text-center">'+Sim+'</td><td class="col-md-3 text-center">'+Nao+'</td><td id="perg4" class="col-md-3 text-center">'+Date()+'</td></tr>');
  }

}
