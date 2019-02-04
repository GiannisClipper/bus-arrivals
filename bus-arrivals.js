class BusArrivals {

  constructor($data, $mem) {
      //this.origin='http://localhost:5000';
      this.origin='https://gc-info.herokuapp.com';
      this.$data=$data;
      this.$mem=$mem;
    }

  createStructureIn($parent) {
      /*
      when user click on <li> items, requests bus lines, routes, stops,
      code creates the following structure inside <li> and fill it with requested data
      if structure already exists, code deletes it hidding data shown previously 
      +---------------+ +------------------------------+
      | div.left      | | div.right                    |
      |               | |                              |
      | +-----------+ | | +--------------------------+ |
      | | img.icon  | | | | div.title                | |
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
      let $title=document.createElement('div');
      $title.className='title';
      $right.appendChild($title);
      let $ul=document.createElement('ul');
      $right.appendChild($ul);

      return {$left:$left, $icon:$icon, $right:$right, $title:$title, $ul:$ul};
    }

  isEmptyStructureIn($ul) {
    return ($ul.children.length>0)?false:true;
  }

  removeStructureIn($ul) {
    let uls=$ul.parentElement.querySelectorAll('ul');
    //first clear any possible intervals
    uls.forEach(x=> {if (x.interval) clearInterval(x.interval);});

    //then clear list items
    for (let i=$ul.children.length-1; i>=0; i--)
      $ul.children[i].remove();
  }

  getLines() {      
    fetch(`${this.origin}/api/buses?act=webGetLines`)
    .then(res=> res.json())
    .then(lines=> {
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
        stru.$title.textContent=`${line['LineID']}: ${line['LineDescr']}`; //(${line['LineCode']})`;

        $li.dataset.LineID=line['LineID'];
        $li.dataset.LineCode=line['LineCode'];
        $li.addEventListener("click", e=> {
          e.stopPropagation();
          this.webGetRoutes(e.currentTarget);
        });
      });
    })
    .catch(err=> alert(err.message));
  }

  webGetRoutes($parent) {
    let $ul=$parent.querySelector('ul');
    if (!this.isEmptyStructureIn($ul)) {
      this.removeStructureIn($ul)

    } else {
      $parent.style.cursor='wait';
      fetch(`${this.origin}/api/buses?act=webGetRoutes&p1=${$parent.dataset.LineCode}`)
      .then(res=> res.json())
      .then(routes=> {
        routes.map(route=> {
          let $li=document.createElement('li');
          $ul.appendChild($li);
          $li.className='route';
          let stru=this.createStructureIn($li);
          stru.$icon.src='./icons/routes.png';
          stru.$title.textContent=`${$parent.dataset.LineID}: ${route['RouteDescr']}`; //(${route['RouteCode']})`;

          $li.dataset.RouteCode=route['RouteCode'];
          $li.addEventListener("click", e=> {
            e.stopPropagation();
            this.webGetStops(e.currentTarget);
          });
        });

        if ($ul.children.length==1)
          this.webGetStops($ul.children[0]);

      })
      .catch(err=> alert(err.message))
      .finally(()=> $parent.style.cursor='default');
    }
  }

  webGetStops($parent) {
    let $ul=$parent.querySelector('ul');
    if (!this.isEmptyStructureIn($ul)) {
      this.removeStructureIn($ul)

    } else {
      $parent.style.cursor='wait';
      fetch(`${this.origin}/api/buses?act=webGetStops&p1=${$parent.dataset.RouteCode}`)
      .then(res=> res.json())
      .then(stops=> {
        stops.map(stop=> {
          let $li=document.createElement('li');
          $ul.appendChild($li);
          $li.className='stop';
          let stru=this.createStructureIn($li);
          stru.$icon.src='./icons/stop-red.png';
          stru.$title.textContent=`${stop['StopDescr']}`; //(${stop['StopCode']})`;

          $li.dataset.StopCode=stop['StopCode'];
          $li.addEventListener("click", e=> {
            e.stopPropagation();
            this.getStopArrivals(e.currentTarget);
          });
        });
      })
      .catch(err=> alert(err.message))
      .finally(()=> $parent.style.cursor='default');
    }
  }

  getStopArrivals($parent) {
    let $ul=$parent.querySelector('ul');
    if (!this.isEmptyStructureIn($ul)) {
      this.removeStructureIn($ul)
    } else {
      this.getStopArrivalsUpdate($parent, $ul);
      if ($parent.className!=='mem')
        this.setInMem($parent.dataset.StopCode, 'title of'+$parent.dataset.StopCode); 
      $ul.interval=setInterval(()=>{
        console.log('interval getStopArrivals', Date(Date.now()));
        this.getStopArrivalsUpdate($parent, $ul);
      }, 20000)
    }
  }

  getStopArrivalsUpdate($parent, $ul) {
    $parent.style.cursor='wait';
    fetch(`${this.origin}/api/buses?act=getStopArrivals&p1=${$parent.dataset.StopCode}`)
    .then(res=> res.json())
    .then(arrivals=> {

      let counter=-1;
      if (arrivals) {
        fetch(`${this.origin}/api/buses?act=webRoutesForStop&p1=${$parent.dataset.StopCode}`)
        .then(res=> res.json())
        .then(routes=> {

          arrivals.map(arrival=> {
            let $li=this.getNextLi($ul, ++counter);
            let route=routes.filter(x=> x['RouteCode']===arrival['route_code']);
            let LineID=route[0]['LineID'];
            let RouteDescr=route[0]['RouteDescr'];
            $li.textContent=`${LineID}: ${RouteDescr}: ${arrival['btime2']}'`;
          });

          //after arrivals refresh delete any <li> tags no more needed
          for (let i=$ul.children.length-1; i>counter; i--)
            $ul.children[i].remove();
        });
      } else {
        let $li=this.getNextLi($ul, ++counter);
        $li.textContent=`(no arrivals)`;
      }
    })
    .catch(err=> alert(err.message))
    .finally(()=> $parent.style.cursor='default');
}

  //on arrivals refresh replace existing <li> tags or add new if needed
  getNextLi($ul, counter) {
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

  setInMem(StopCode, title) {
    let $ul=this.$mem.querySelector('ul');
    let $li=document.createElement('li');
    $ul.insertBefore($li, $ul.childNodes[0]);
    $li.className='mem';

    let stru=this.createStructureIn($li);
    stru.$icon.src='./icons/stop-red.png';
    stru.$title.textContent=title;

    $li.dataset.StopCode=StopCode;
    $li.addEventListener("click", e=> {
      e.stopPropagation();
      this.getStopArrivals(e.currentTarget);
    });

    for (let i=$ul.children.length-1; i>3; i--) {
      //in case exist any possible intervals
      let $sub_ul=$ul.children[i].querySelector('ul');
      if (!this.isEmptyStructureIn($sub_ul))
        this.removeStructureIn($sub_ul)  
      $ul.children[i].remove();
    }
    this.saveMem();
  }

  saveMem() {
    let $ul=this.$mem.querySelector('ul');
    let mem=[];
    for (let i=0; i<=$ul.children.length-1; i++)
      mem.push({StopCode:$ul.children[i].dataset.StopCode, title:$ul.children[i].querySelector('.title').textContent});
    localStorage.setItem("mem", JSON.stringify(mem));
  }

  restoreMem() {
    let mem=JSON.parse(localStorage.getItem('mem'));
    if (mem)
      mem.forEach(x=> this.setInMem(x.StopCode, x.title));
  }
}