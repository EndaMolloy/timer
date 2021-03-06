$(document).ready(function () {

  let hrs = 0;
  let mins=0;
  let secs =0;
  let hrsTen  = 0;
  let hrsOne  = 0;
  let minsOne = 0;
  let minsTen = 0;
  let secsTen = 0;
  let secsOne = 0;
  let sessionHrsTen;
  let sessionHrsOne;
  let sessionMinsTen;
  let sessionMinsOne;
  let sessionSecsTen;
  let sessionSecsOne;
  let sessionHrs;
  let sessionMins;
  let sessionSecs;
  let totalSessionSecs = 0;
  let count = 0;

  let Interval;
  let pause = false;
  let reset = false;
  let selectedProj;
  var isCounting = false;
  const inputBoxes = document.getElementById('main').getElementsByTagName('input');
  const labelDiv = document.getElementById('labels');

  //load localStorage values
  initialSetup();

  const time = moment().format('dddd') +", "+moment().format('LL');
  document.getElementById('time').textContent = time;


  //listen for user inputs to change countdown timer value
  for(let i=0; i<inputBoxes.length; i++){
    inputBoxes[i].addEventListener('change',(ev)=>{
      getTimeValues();
      saveSessionLength();
      parseTimeValues();

    })
  }



  $("#main").on('keydown','input', function(event){
    const num = /[0-9]/g;
    //If number
    if(num.test(event.key))
      $(this).val(event.key);

      getTimeValues();
      saveSessionLength();
      parseTimeValues();
  });


  $("#button-start").on('click',()=>{
    //find the project id of the selected project
    if(count === 0){
      selectedProj = getSelectedProjectId($(".projects li"));
      count++;
    }

    if(isCounting){
      clearInterval(Interval);
      isCounting = false;
      document.getElementById('play').classList.remove('fa-pause');
      document.getElementById('play').classList.add('fa-play');
      document.getElementById('button-reset').style.display = 'inline-block';
      document.getElementById('button-delete').style.display = 'inline-block';
      document.getElementById('button-finish').style.visibility = 'visible';
    }
    else{
          //if no value entered alert user
      if(!hrs && !mins && !secs){
        alert("Please enter a time...")
      }
      else{
        isCounting = true;
        document.getElementById('play').classList.remove('fa-play');
        document.getElementById('play').classList.add('fa-pause');
        document.getElementById('button-reset').style.display = 'none';
        document.getElementById('button-delete').style.display = 'none';
        document.getElementById('button-finish').style.visibility = 'hidden';


        getTimeValues();
        parseTimeValues();
        setTimeDisplay();
        modifyInputField();
        const startedTime = moment();
        const endtime = moment.duration({'h': hrs, 'm': mins, 's': secs});
        //let endtime = moment().add(hrs,'h').add(mins,'m').add(secs,'s');
        // console.log("startedTime: ", startedTime.format());
        // console.log("endtime: ",endtime.format());
        Interval = setInterval(startTimer, 500, startedTime, endtime);
      }
    }
  });

  $("#button-reset").on('click',()=>{
    timerReset();
  });

  $("#button-delete").on('click',()=>{
    timerClear();
  });

  $("#button-finish").on('click',()=>{
    timerFinishEarly();
  });


  function initialSetup(){

    //check to see if there is any values in the sessionvariable
    const sessionLength = JSON.parse(localStorage.getItem('sessionLength'));
    if(sessionLength){
      hrsTen = sessionLength.sessionHrsTen;
      hrsOne = sessionLength.sessionHrsOne;
      minsTen = sessionLength.sessionMinsTen;
      minsOne = sessionLength.sessionMinsOne;
      secsTen = sessionLength.sessionSecsTen;
      secsOne = sessionLength.sessionSecsOne;
      setTimeDisplay();
    }
    else{
      //use the default values from html inputBoxes
      getTimeValues();
    }
    //shorthand values
    //e.g hrs = 5 mins=13 secs=42 rather than units i.e. secsTen secsOne...
    parseTimeValues();
    saveSessionLength();
  }

  function sendToMongo(time){
    const timeLog = {
      sessionLength: time,
      timestamp: new Date().setHours(0,0,0,0)
    }

    document.getElementById('logStatus').style.visibility = 'visible';

    $.post('https://workdeep.herokuapp.com'+userUrl+'/logtime/'+selectedProj, timeLog, function(message){

      if(message.error){
        console.log('Something bad happened');
      }else{
        document.getElementById('logStatus').textContent = 'Logged.';
        isCounting = false;
        timerReset();
        if(loaded)
          document.getElementById('button-updateCharts').style.visibility = 'visible';

        setTimeout(function(){
          document.getElementById('logStatus').style.visibility = 'hidden';
        }, 5000);
      }
    });
  };


  function timerFinishEarly(){
    const confirm = window.confirm("Finish your current session and log your time?")

    if(confirm){

      parseTimeValues();

      //convert all in seconds
      const stoppedHrs = Number(hrs)*60*60;
      const stoppedMins = Number(mins)*60;
      const stoppedSecs = Number(secs);

      const totalStoppedSecs = stoppedHrs+stoppedMins+stoppedSecs;

      //console.log("totalStoppedSecs", totalStoppedSecs);
      //console.log("diffInHrs :", diffInHrs(totalStoppedSecs));
      sendToMongo(diffInHrs(totalStoppedSecs));
      clearInterval(Interval);
    }
  }

  function timerReset(){
    count = 0;
    clearInterval(Interval);
    resetValues();
    setTimeDisplay();
    modifyInputField();
    setButtons();
  }

  function timerClear(){
    clearInterval(Interval);
    clearValues();
    setTimeDisplay();
    modifyInputField();
    setButtons();
  }

  //needed to find the project id for post request
  function getSelectedProjectId(li){
    if(!li) return;

    const selector = 'fa-circle-thin';
    for(let i=0; i<li.length; i++){
      if(li[i].innerHTML.indexOf(selector) === -1){
        let projectId = li[i].lastElementChild.action.replace("https://workdeep.herokuapp.com/liveprojects/","");
        return projectId;
      }
    }
  }

  function getTimeValues(){
    hrsTen = document.getElementById("hoursTen").value || '0';
    hrsOne = document.getElementById("hoursOne").value || '0';
    minsTen = document.getElementById("minutesTen").value || '0';
    minsOne = document.getElementById("minutesOne").value || '0';
    secsTen = document.getElementById("secondsTen").value || '0';
    secsOne = document.getElementById("secondsOne").value || '0';

    if(minsTen>5){
      minsTen = minsTen - 6;
      hrsOne = 1;
    }
  }

  function saveSessionLength(){
    sessionHrsTen  = hrsTen;
    sessionHrsOne  = hrsOne;
    sessionMinsTen = minsTen;
    sessionMinsOne = minsOne;
    sessionSecsTen = secsTen;
    sessionSecsOne = secsOne;

    const sessionLength = {
      sessionHrsTen,
      sessionHrsOne,
      sessionMinsTen,
      sessionMinsOne,
      sessionSecsTen,
      sessionSecsOne
    };

    localStorage.setItem('sessionLength',JSON.stringify(sessionLength));
    //console.log(JSON.parse(localStorage.getItem('sessionLength')));
    //all values in seconds
    sessionHrs = Number(sessionHrsTen+sessionHrsOne)*60*60;
    sessionMins = Number(sessionMinsTen+sessionMinsOne)*60;
    sessionSecs = Number(sessionSecsTen+sessionMinsOne);

    // console.log("totalSessionSecs", totalSessionSecs);
    totalSessionSecs = sessionHrs+sessionMins+sessionSecs;
  }

  function clearValues(){
    hrsTen =  '0';
    hrsOne =  '0';
    minsTen = '0';
    minsOne = '0';
    secsTen = '0';
    secsOne = '0';
  }

  function parseTimeValues(){
    hrs =  hrsTen.toString() + hrsOne.toString();
    mins = minsTen.toString() + minsOne.toString();
    secs = secsTen.toString() + secsOne.toString();

    //console.log("mins:" ,mins);
  }

  function sessionValuesToHrs(){
    return totalSessionSecs/3600;
  }

  function modifyInputField(){

    if(isCounting){
      labelDiv.style.color = '#21272d';

      for(let i=0; i<inputBoxes.length; i++){
        inputBoxes[i].style['border-bottom']='none';
        inputBoxes[i].disabled = true;
      }
    }
    else{
      labelDiv.style.color = 'white';

      for(let i=0; i<inputBoxes.length; i++){
        inputBoxes[i].style['border-bottom']='1.5px solid white';
        inputBoxes[i].disabled = false;
      }
    }
  }

  function setButtons(){
    document.getElementById('play').classList.remove('fa-pause');
    document.getElementById('play').classList.add('fa-play');
    document.getElementById('button-finish').style.visibility = 'hidden';
    document.getElementById('button-delete').style.display = 'none';
    document.getElementById('button-reset').style.display = 'none';
  }

  function resetValues(){
    hrsTen = sessionHrsTen
    hrsOne =  sessionHrsOne
    minsTen = sessionMinsTen
    minsOne = sessionMinsOne
    secsTen = sessionSecsTen
    secsOne = sessionSecsOne
  }

  function diffInHrs(stoppedSecs){
    const totalSecs = totalSessionSecs - stoppedSecs;

    return totalSecs/3600;
  }

  function startTimer (startedTime, endtime) {

    parseTimeValues();

    const tempTimer = Math.floor((moment()-startedTime)/1000);
    const timeRemainingSeconds = endtime.asSeconds() - tempTimer;

    // const timeRemaining = moment.duration(endtime.diff(moment()));
    // const timeRemainingSeconds = Math.floor(timeRemaining.asSeconds());

    //convert seconds to hours / 3600
    const hours = Math.floor(timeRemainingSeconds / 3600);
    const minutes = Math.floor((timeRemainingSeconds % 3600)/60);
    const seconds = timeRemainingSeconds % 60;

    if(timeRemainingSeconds < 0){
      alert("Times up");
      // console.log("FINISHED");
      clearInterval(Interval);
      sendToMongo(sessionValuesToHrs());
    }else{
      updateSeconds(seconds);
      updateMinutes(minutes);
      updateHours(hours);
      setTimeDisplay();
    }

  }


  //Basic calculation to get time in correct format
  //if 24 seconds then the 10 unit is found by dividing by 10. Math.floor(24/10) = 2
  //the 1 unit is found by getting the remainder. 24 % 20 = 4
  function updateSeconds(seconds){
    if(seconds>=10){
      secsTen = Math.floor(seconds/10);
      secsOne = seconds % (secsTen*10);
    }
    else {
      secsTen = 0;
      secsOne = seconds;
    }
  }

  function updateMinutes(minutes){
    if(minutes>=10){
      minsTen = Math.floor(minutes/10);
      minsOne = minutes % (minsTen*10)
    }
    else{
      minsTen = 0;
      minsOne = minutes;
    }
  }

  function updateHours(hours){
    if(hours>=10){
      hrsTen = Math.floor(hours/10);
      hrsOne = hours % (hrsTen*10)
    }
    else{
      hrsTen = 0;
      hrsOne = hours;
    }
  }

  function setTimeDisplay(){

    document.getElementById('secondsOne').value = secsOne;
    document.getElementById('secondsTen').value = secsTen;
    document.getElementById("minutesTen").value = minsTen;
    document.getElementById("minutesOne").value = minsOne;
    document.getElementById("hoursTen").value = hrsTen;
    document.getElementById("hoursOne").value = hrsOne;

  }

});
