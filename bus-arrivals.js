class BusArrivals {

  constructor($data, $mem) {
    //this.origin='http://localhost:5000';
    this.origin='https://gc-info.herokuapp.com';
    this.$data=$data;
    this.$mem=$mem;
    this.memLength=6;

    //hides bus Arrivals lists and stops auto refresh after 3-4 minutes 
    //in order to control forgotten bus Arrivals lists and infinity requests.
    this.refreshControl=setInterval(()=> {
      console.log('interval refreshControl');
      let uls=document.body.querySelectorAll('.stop ul, #mem ul li ul');
      uls.forEach(x=> {
        if (x.interval && parseInt(Date.now())-parseInt(x.timestamp)>180000) {
          console.log(parseInt(Date.now())-parseInt(x.timestamp));
          clearInterval(x.interval);
          for (let i=x.children.length-1; i>=0; i--) 
            x.children[i].remove();
        }
      });
    }, 60000);
  }

  createStructureIn($parent) {
    /*
    code creates the following structure inside each <li> tag
    to organize the data of each record (line, route or stop)
    +---------------+ +------------------------------+
    | div.left      | | div.right                    |
    |               | |                              |
    | +-----------+ | | +--------------------------+ |
    | | img.icon  | | | | div.descr                | |
    | +-----------+ | | +--------------------------+ |
    |               | | +--------------------------+ |
    |               | | | ul                       | |
    |               | | |                          | |
    |               | | +--------------------------+ |
    +---------------+ +------------------------------+
    */
    let $left=document.createElement('div');
    $left.className='left';
    $parent.appendChild($left);
    let $icon=document.createElement('img');
    $icon.className='icon';
    $left.appendChild($icon);

    let $right=document.createElement('div');
    $right.className='right';
    $parent.appendChild($right);
    let $descr=document.createElement('div');
    $descr.className='descr';
    $right.appendChild($descr);
    let $ul=document.createElement('ul');
    $right.appendChild($ul);

    return {$left:$left, $icon:$icon, $right:$right, $descr:$descr, $ul:$ul};
  }

  removeStructureFrom($ul) {
    if ($ul.children.length>0) {
      let uls=$ul.parentElement.querySelectorAll('ul');
      //first clear any possible intervals
      uls.forEach(x=> {if (x.interval) clearInterval(x.interval);});
      //then clear list items
      for (let i=$ul.children.length-1; i>=0; i--) $ul.children[i].remove();
      return true;
    } else {
      return false;
    }
  }

  getData($parent, url, callback) {
    $parent.style.cursor='wait';
    fetch(url)
    .then(res=> res.json())
    .then(data=> callback(data))
    .catch(err=> alert(err.message))
    .finally(()=> $parent.style.cursor='pointer');
  }

  getLines() {
    let url=`${this.origin}/api/buses?act=webGetLines`;
    let callback=lines=> {
      let $ul=this.$data.querySelector('ul');
      let id='';  
      lines.map(line=> {
        let $li=document.createElement('li');
        $ul.appendChild($li);
        $li.className='line';

        //when first bus-line digit change, define a li.id to be pointed by menu
        if (line['LineID'][0]!==id) {
          id=line['LineID'][0];
          $li.id=id;
        }
 
        let stru=this.createStructureIn($li);
        //yellow icon for trolley and blue for all other buses
        stru.$icon.src=(line['LineID'].length<3 && parseInt(line['LineID'][0]))?'./icons/bus-yellow.png':'./icons/bus-blue.png';
        stru.$descr.textContent=`${line['LineID']}: ${line['LineDescr']}`; //(${line['LineCode']})`;

        $li.dataset.LineID=line['LineID'];
        $li.dataset.LineCode=line['LineCode'];
        $li.addEventListener("click", e=> {
          e.stopPropagation();
          this.getRoutes(e.currentTarget);
        });
      });
    }
    this.getData(document.body, url, callback);
  }

  getRoutes($parent) {
    let $ul=$parent.querySelector('ul');
    if (!this.removeStructureFrom($ul)) {
      let url=`${this.origin}/api/buses?act=webGetRoutes&p1=${$parent.dataset.LineCode}`;
      let callback=routes=> {
        routes.map(route=> {
          let $li=document.createElement('li');
          $ul.appendChild($li);
          $li.className='route';
          let stru=this.createStructureIn($li);
          stru.$icon.src='./icons/routes.png';
          stru.$descr.textContent=`${$parent.dataset.LineID}: ${route['RouteDescr']}`; //(${route['RouteCode']})`;

          $li.dataset.RouteCode=route['RouteCode'];
          $li.addEventListener("click", e=> {
            e.stopPropagation();
            this.getStops(e.currentTarget);
          });
        });
        //if exists only one route get stops automatically
        if ($ul.children.length==1)
          this.getStops($ul.children[0]);
      }
      this.getData($parent, url, callback);
    }
  }

  getStops($parent) {
    let $ul=$parent.querySelector('ul');
    if (!this.removeStructureFrom($ul)) {
      let url=`${this.origin}/api/buses?act=webGetStops&p1=${$parent.dataset.RouteCode}`;
      let callback=stops=> {
        stops.map(stop=> {
          let $li=document.createElement('li');
          $ul.appendChild($li);
          $li.className='stop';
          let stru=this.createStructureIn($li);
          stru.$icon.src='./icons/stop-pink.png';
          stru.$descr.textContent=`${stop['StopDescr']}`; //(${stop['StopCode']})`;

          $li.dataset.StopCode=stop['StopCode'];
          $li.addEventListener("click", e=> {
            e.stopPropagation();
            this.getStopArrivals(e.currentTarget);
          });
        });
      }
      this.getData($parent, url, callback);
    }
  }

  getStopArrivals($parent) {
    let $ul=$parent.querySelector('ul');
    if (!this.removeStructureFrom($ul)) {
      this.getStopArrivalsUpdate($parent, $ul);
      
      //save in mem
      let StopCode=$parent.dataset.StopCode;
      if ($parent.className!=='mem' && !this.findInMem(StopCode)) {
        let descr=`${$parent.querySelector('.descr').textContent}
          (${$parent.parentElement.parentElement.parentElement.parentElement.parentElement.querySelector('.descr').textContent})`;
          //li.stop < ul < div.right < li.route < ul < div.right        
        this.setInMem(StopCode, descr);
        this.saveMem();
      }

      //init interval refresh
      $ul.timestamp=Date.now();
      $ul.interval=setInterval(()=>{
        console.log('interval getStopArrivals', Date(Date.now()));
        this.getStopArrivalsUpdate($parent, $ul);
      }, 20000)
    }
  }

  getStopArrivalsUpdate($parent, $ul) {
    let url=`${this.origin}/api/buses?act=getStopArrivals&p1=${$parent.dataset.StopCode}`;
    let callback=arrivals=> {
      let counter=-1;
      if (arrivals) {
        fetch(`${this.origin}/api/buses?act=webRoutesForStop&p1=${$parent.dataset.StopCode}`)
        .then(res=> res.json())
        .then(routes=> {
          arrivals.map(arrival=> {
            let $li=this.refreshArrivalsList($ul, ++counter);
            let route=routes.filter(x=> x['RouteCode']===arrival['route_code']);
            let LineID=route[0]['LineID'];
            let RouteDescr=route[0]['RouteDescr'];
            $li.textContent=`${LineID}: ${RouteDescr}: ${arrival['btime2']}'`;
          });

          //delete any <li> tags no more needed after arrivals refresh 
          for (let i=$ul.children.length-1; i>counter; i--)
            $ul.children[i].remove();
        });
      } else {
        let $li=this.refreshArrivalsList($ul, ++counter);
        $li.textContent=`(no arrivals)`;

        //delete any <li> tags no more needed after arrivals refresh 
        for (let i=$ul.children.length-1; i>counter; i--)
          $ul.children[i].remove();
      }
    }
    this.getData($parent, url, callback);
}

  refreshArrivalsList($ul, counter) {   
    //replace existing <li> tags or add new if needed on arrivals refresh
    let $li;
    if (counter<=$ul.children.length-1) {
      $li=$ul.children[counter];
    } else {
      $li=document.createElement('li');
      $ul.appendChild($li);
      $li.className='arrival';
    }
    return $li;
  }

  setInMem(StopCode, descr) { //put a selected stop in mem list
    let $ul=this.$mem.querySelector('ul');
    let $li=document.createElement('li');
    $ul.insertBefore($li, $ul.childNodes[0]);
    $li.className='mem';

    let stru=this.createStructureIn($li);
    stru.$icon.src='./icons/stop-pink.png';
    stru.$descr.textContent=descr;
    $li.dataset.StopCode=StopCode;
    $li.addEventListener("click", e=> {
      e.stopPropagation();
      this.getStopArrivals(e.currentTarget);
    });

    for (let i=$ul.children.length-1; i>this.memLength-1; i--) {
      //first remove any possible intervals
      let $sub_ul=$ul.children[i].querySelector('ul');
      this.removeStructureFrom($sub_ul);
      $ul.children[i].remove();
    }
  }

  findInMem(StopCode) { //find if a stopcode already exists in mem list
    let mem=JSON.parse(localStorage.getItem('mem'));
    return mem?(mem.find(x=> x.StopCode===StopCode)?true:false):false;
  }

  saveMem() { //save mem list in localstorage
    let $ul=this.$mem.querySelector('ul');
    let mem=[];
    for (let i=0; i<=$ul.children.length-1; i++)
      mem.push({StopCode:$ul.children[i].dataset.StopCode, descr:$ul.children[i].querySelector('.descr').textContent});
    localStorage.setItem("mem", JSON.stringify(mem.reverse()));
  }

  restoreMem() { //restore mem list from localstorage
    let mem=JSON.parse(localStorage.getItem('mem'));
    if (mem) mem.forEach(x=> this.setInMem(x.StopCode, x.descr));
  }
}