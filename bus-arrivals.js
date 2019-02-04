class BusArrivals {

  constructor($root) {
      //this.origin='http://localhost:5000';
      this.origin='https://gc-info.herokuapp.com';
      this.$root=$root;
  }

  createStructureIn($parent) {
      let $left=document.createElement('div');
      $left.className='left';
      $parent.appendChild($left);
      let $icon=document.createElement('img');
      $icon.className='icon';
      $left.appendChild($icon);

      let $right=document.createElement('div');
      $right.className='right';
      $parent.appendChild($right);
      let $header=document.createElement('header');
      $right.appendChild($header);
      let $section=document.createElement('section');
      $right.appendChild($section);

      return {$left:$left, $icon:$icon, $right:$right, $header:$header, $section:$section};
    }

  isEmptyStructureIn($section) {
    return ($section.children.length>0)?false:true;
  }

  removeStructureIn($section) {
    let sections=$section.parentElement.querySelectorAll('section');
    //first clear any possible intervals
    sections.forEach(x=> {
      if (x.interval) clearInterval(x.interval);
    });
    //there is always only one ul in sections
    $section.children[0].remove();
  }

  getLines() {      
    fetch(`${this.origin}/api/buses?act=webGetLines`)
    .then(res=> res.json())
    .then(lines=> {
      let $ul=document.createElement('ul');
      this.$root.appendChild($ul);
      let id='';
      lines.map(line=> {
        let $li=document.createElement('li');
        $ul.appendChild($li);
        $li.className='line';

        //when first bus-line digit change, define a li.id to be pointed by header menu
        if (line['LineID'][0]!==id) {
          id=line['LineID'][0];
          $li.id=id;
        }
 
        let stru=this.createStructureIn($li);
        stru.$icon.src=(line['LineID'].length<3 && parseInt(line['LineID'])!==NaN)?'./icons/bus-yellow.png':'./icons/bus-blue.png';
        stru.$header.textContent=`${line['LineID']}: ${line['LineDescr']} (${line['LineCode']})`;

        $li.dataset.LineID=line['LineID'];
        $li.dataset.LineCode=line['LineCode'];
        $li.addEventListener("click", e=> {
          e.stopPropagation();
          //alert(e.currentTarget.tagName);
          this.webGetRoutes(e.currentTarget);
        });
      });
    })
    .catch(err=> alert(err.message));
  }

  webGetRoutes($parent) {
    let $section=$parent.querySelector('section');
    if (!this.isEmptyStructureIn($section)) {
      this.removeStructureIn($section)

    } else {    
      fetch(`${this.origin}/api/buses?act=webGetRoutes&p1=${$parent.dataset.LineCode}`)
      .then(res=> res.json())
      .then(routes=> {
        let $ul=document.createElement('ul');
        $section.appendChild($ul);
        routes.map(route=> {
          let $li=document.createElement('li');
          $ul.appendChild($li);
          $li.className='route';
          let stru=this.createStructureIn($li);
          stru.$icon.src='./icons/routes.png';
          stru.$header.textContent=`${$parent.dataset.LineID}: ${route['RouteDescr']} (${route['RouteCode']})`;

          $li.dataset.RouteCode=route['RouteCode'];
          $li.addEventListener("click", e=> {
            e.stopPropagation();
            this.webGetStops(e.currentTarget);
          });
        });

        if ($ul.children.length==1)
          this.webGetStops($ul.children[0]);

      })
      .catch(err=> alert(err.message));
    }
  }

  webGetStops($parent) {
    let $section=$parent.querySelector('section');
    if (!this.isEmptyStructureIn($section)) {
      this.removeStructureIn($section)

    } else {    
      fetch(`${this.origin}/api/buses?act=webGetStops&p1=${$parent.dataset.RouteCode}`)
      .then(res=> res.json())
      .then(stops=> {
        let $ul=document.createElement('ul');
        $section.appendChild($ul);
        stops.map(stop=> {
          let $li=document.createElement('li');
          $ul.appendChild($li);
          $li.className='stop';
          let stru=this.createStructureIn($li);
          stru.$icon.src='./icons/stop-hand.png';
          stru.$header.textContent=`${stop['StopDescr']} (${stop['StopCode']})`;

          $li.dataset.StopCode=stop['StopCode'];
          $li.addEventListener("click", e=> {
            e.stopPropagation();
            this.getStopArrivals(e.currentTarget);
          });
        });
      })
      .catch(err=> alert(err.message));
    }
  }

  getStopArrivals($parent) {
    let $section=$parent.querySelector('section');
    if (!this.isEmptyStructureIn($section)) {
      this.removeStructureIn($section)
    } else {
      this.getStopArrivalsUpdate($parent, $section);
      $section.interval=setInterval(()=>{
        console.log('interval getStopArrivals', Date(Date.now()));
        this.getStopArrivalsUpdate($parent, $section);
      }, 20000)
    }
  }

  getStopArrivalsUpdate($parent, $section) { 
    fetch(`${this.origin}/api/buses?act=getStopArrivals&p1=${$parent.dataset.StopCode}`)
    .then(res=> res.json())
    .then(arrivals=> {

      let $ul=$section.querySelector('ul');
      if (!$ul) { //$ul.remove();
        $ul=document.createElement('ul');
        $section.appendChild($ul);
      }

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
          for (let i=$ul.children.length-1; i>counter; i++)
            $ul.children[i].remove();
        });
      } else {
        let $li=this.getNextLi($ul, ++counter);
        $li.textContent=`(no arrivals)`;
      }
    })
    .catch(err=> alert(err.message));
  }

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
}