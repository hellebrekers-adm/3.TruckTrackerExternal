var drivers = [];
var directionsRenderer = null;
var oms = null;
var iw = null;
var markers = [];
var lines = [];
var addedLines = false;
var lineCOunt =0 ;
var childMarkers;
var showLogs = true;

var style = document.createElement('style');
style.innerText = `
.custom-pin{

    height: 1em;
    line-height: 1;
    width: 1em;
    padding: 0.7em;
    text-align: center;
    cursor: pointer;
    color: #fff;
    background: #000;
    position: absolute;
    border-radius: 0.5em;
    font-size: 1em;
    font-weight: 700;
    transition: 0.5s;
    overflow: visible;
    z-index: 0;
}
.custom-pin::after {
    content: "";
    border-width: 1em 0.5em;
    border-color: #000 transparent transparent;
    border-style: solid;
    position: relative;
    top: 99%;
    left: calc(50% - 0.5em);
}
.custom-pin:hover {
    transform: scale(1.15);
}
.child-marker,
.child-marker::after {
    background: #8fbc8f;
    position: absolute;
}
.child-marker {
    // border-radius: 1em;
    padding: 0.1em;
    width: 5em;
    z-index: 3;
    font-weight: 400;
    transform: translate(-50%, -50%);
}

.line {
    position: absolute;
    height: 2px;
    background: #fff;
    color: #fff;
    z-index: -1;
    transform-origin: top left;
}

.desktop-multi-columns-layout-with-grid
{
    flex: 1 1 auto;
}
`;

function showChildMarkers(clusterIcon, event) {
    let markers = clusterIcon.cluster_.markers_;
    var clusterElement = event.currentTarget;
    
    childMarkers = document.createElement('div');
    var totalMarkers = markers.length;

    var baseRadius = 30;
    var multiplier = 8.2; // This value determines how much the radius grows for each additional marker.

    var radius = baseRadius + (multiplier * (totalMarkers));

    childMarkers.classList.add('child-markers');

    var angleIncrement = (2 * Math.PI) / totalMarkers;  // angle between each marker

    markers.forEach(function(item, index) {
        var currentAngle = index * angleIncrement;
        
        var marker = document.createElement('div');
        var t = document.createTextNode(item.customData.name);

        // Calculate position
        var x = radius * Math.cos(currentAngle);
        var y = radius * Math.sin(currentAngle);
        
        marker.style.left = `calc(50% + ${x}px)`;
        marker.style.top = `calc(50% + ${y}px)`;

        marker.classList.add('child-marker');
        marker.appendChild(t);
        
        if(!addedLines){
            // Create and append the line to the markers
            var line = document.createElement('div');
            line.classList.add('line');

            line.style.width = `${radius}px`;
            line.style.transform = `rotate(${currentAngle}rad)`;
            line.style.left = "50%";
            line.style.top = "50%";
            
            // Append line to parent of clusterElement, so it's at the same level as the child markers.
            clusterElement.appendChild(line);
            lines.push(line);
        }
        
        childMarkers.appendChild(marker);
    });
    addedLines = false;
    clusterElement.appendChild(childMarkers);
}

function hideChildMarkers(clusterIcon, event) {

    if (childMarkers) {
        for (var i = 0; i < lines.length; i++) {
            lines[i].remove();
        }
        event.currentTarget.removeChild(childMarkers);
    }
}

function InitializeHtml()
{

    document.body.appendChild(style);

    var main = window.parent.document;

    var main = window.parent.document;
    var collapsibleTab = main.getElementsByClassName('collapsibleTab')[0];
    
    collapsibleTab = main.getElementsByClassName('collapsibleTab')[1];
    const header = main.getElementsByClassName('ms-nav-layout-head')[0];   
    //step 1: remove header
    // if(header == null)
    // {console.error('header not found');}
    // else
    // {header.remove();  }

    var container = main.getElementsByClassName('collapsibleTab-container')[0];
    if(container == null)
    {console.error('container not found');}
    else
    {container.setAttribute("style", "height: 100%");}

    var test = main.getElementsByClassName('ms-nav-band expanded')[0];
    if(test == null)
    {console.error('test not found');}
    else
    {test.setAttribute("style", "height: 100%");}
    
    //step 2: remove left menu
    var list = main.getElementsByClassName('ms-nav-group no-caption ms-nav-group-contains-grid multi-columns-with-grid-column-2-0')[0];
    if(list == null)
    {console.error('list not found');}
    else{
        list.setAttribute("style", "grid-column: span 1; max-width: 20%; ");
    }

    //step 3: remove right menu
    var map = main.getElementsByClassName('control-addin-container multi-columns-with-grid-column-2-1');
    if(map == null)
    {console.error('map not found');}
    else{
        map[0].setAttribute("style", "height: 100%; max-width: calc(80%)");
        map[0].firstChild.setAttribute("style", "height: 100%; width: 100%;");
    }
    
    var collapsibleTab = main.getElementsByClassName('collapsibleTab')[1];
    //step 4: remove collapsible tab
    if(collapsibleTab == null)
    {
        collapsibleTab = main.getElementsByClassName('collapsibleTab')[0];
        if(collapsibleTab == null){
            console.error('collapsibleTab not found on second itteration');
        }
        else
        {
            collapsibleTab.setAttribute("style", "width:100%; height:100%;");
        }
    }
    else{
        collapsibleTab.setAttribute("style", "width:100%; height:100%;");
    }

    // StartUpdatePageLoop(20000);
    

    Microsoft.Dynamics.NAV.InvokeExtensibilityMethod('HtmlInitializedCallback', []);
}





function iwClose() { 
    iw.close(); 
}

function MoveCameraToLocation(lat, lng) {
    var center = new google.maps.LatLng(lat, lng);
  
    window.ctrlGoogleMap.setCenter(center);
}

function AddMarker(lat, lng, title, description, focus) {
    let marker = new google.maps.Marker({
        position: new google.maps.LatLng(lat, lng),
        map: window.ctrlGoogleMap,
        title: title,
        label:
        {
            text: title,
            color: "white",
            fontSize: "12px",
            fontWeight: "bold"
        }
    });

    if (focus) {
        MoveCameraToLocation(lat, lng);
    }
}

function AddTruckDriver(id, name, startAddress, totalCount) {

    var driver =  new TruckDriver(id,name);
    codeAddressToCoords(startAddress, function (err, startCoords) {
        if (err) {
            console.error('error getting start coords for ' + id);
            console.error(err);
        }
        else {
            var truckSVG = {
                path: "M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
                fillColor: "#FF0000", // Color of the truck. Here, it's red
                fillOpacity: 1.0,
                strokeWeight: 0,
                rotation: 0,
                scale: 1,
                anchor: new google.maps.Point(0, 0),
                labelOrigin: new google.maps.Point(10,10)
            };
            var marker = new google.maps.Marker({
                map: window.ctrlGoogleMap,
                position: new google.maps.LatLng(startCoords.lat(), startCoords.lng()),
                icon: truckSVG,
                label:
                {
                    text: name,
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold"
                }

            });

            marker.customData = {
                title: name,
                name: name
            };
    
            driver.truckMarker = marker;
            // clusterMarkers(); //recluster markers
        }
    });
    
    drivers.push(driver);
}

function clusterMarkers() {
    
    if (window.markerCluster) {
        window.markerCluster.clearMarkers();
    }

    options = {
        cssClass: 'custom-pin',
        onMouseoverCluster: showChildMarkers,
        onMouseoutCluster: hideChildMarkers
    };

    window.markerCluster = new MarkerClusterer(window.ctrlGoogleMap, markers, options);
    showChildMarkers();
}

function SetRouteForTruckDriver(id, startLocation, endLocation) {
  
    var driver = drivers.find(x => x.id === id);
    if (driver != null) {
        codeAddressToCoords(startLocation, function (err, startCoords) {
            if (err) {
                console.error('error getting start coords for ' + id);
                console.error(err);
            }
            else {
                codeAddressToCoords(endLocation, function (err, endCoords) {
                    if (err) {
                        console.error('error getting end coords for ' + id);
                        console.error(err);
                    }

                    else {
                        const directionsService = new google.maps.DirectionsService();
                        const request = {
                            origin: startCoords,
                            destination: endCoords,
                            travelMode: 'DRIVING'
                        };

                        directionsService.route(request, function (response, status) {
                            if (status == 'OK') {
                                driver.route = response;      
                                VisualizeRouteForDriver(id);                          
                                

                            }
                            else{
                                console.error('error getting route for ' + id);
                                console.error(err);
                            }
                        });               
                    }
                });
            }
        });
        
    }
    else
    {
        console.error('truckplan: ' + id + ' not found');
    }

    Microsoft.Dynamics.NAV.InvokeExtensibilityMethod('RouteSetCallback', [id]);
}

function VisualizeRouteForDriver(id) {

    var driver = drivers.find(x => x.id === id);
    if (driver != null) {
        var route = driver.route;
        // if(directionsRenderer == null)
        // {
            directionsRenderer = new google.maps.DirectionsRenderer();
            directionsRenderer.setMap(window.ctrlGoogleMap);
        //}
        if (route != null) {

            directionsRenderer.setDirections(route);
            directionsRenderer.setOptions({
                // polylineOptions: {
                //     strokeColor: 'red'
                // },
                suppressMarkers: true                
            });

            //get last position in route
            var lastPosition = route.routes[0].legs[0].steps[route.routes[0].legs[0].steps.length - 1].end_location;
            
            //Create marker at destination
            var marker = new google.maps.Marker({
                // map: window.ctrlGoogleMap,
                position: new google.maps.LatLng(
                    lastPosition.lat(),
                    lastPosition.lng()
                ),
                label:
                {
                    text: driver.name + ' destination',
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold"
                }
            });

            marker.customData = {
                title: id,
                name: driver.name
            };
            
            markers.push(marker);
            
            if (route != null) 
            {

                const route = driver.route;
                const steps = route.routes[0].legs[0].steps;
                const path = [];

                steps.forEach(step => {
                    path.push(...step.path);
                });

                
                // markers.push(carMarker);                
                // driver.truckMarker = carMarker;
                if(driver.truckMarker == null)
                {
                    console.error('truck marker not found for driver ' + id);
                }
                else
                {
                    // driver.truckMarker.setPosition(new google.maps.LatLng(
                    //     path[600].lat(),
                    //     path[600].lng()
                    // ));
                    // StartDrivingCar(id);
                }
            }
            
            clusterMarkers(); //recluster markers

            Microsoft.Dynamics.NAV.InvokeExtensibilityMethod('RouteVisualizedCallback', [id]);    
        }
        else
        {
            directionsRenderer.setDirections(null);
            console.error('route not found/set for driver ' + id);
        }
    }else
    {
        console.error('driver ' + id + ' not found');
    }
}

function FocusOnRoute(id) {

    var driver = drivers.find(x => x.id === id);
    if (driver != null) {
        var truckMarker = driver.truckMarker;
        if (truckMarker != null) {
            MoveCameraToLocation(truckMarker.position.lat().toString(), truckMarker.position.lng().toString());
        }
        else
        {
            console.error('truck marker not found for driver ' + id);
        }
    }
    else
    {
        console.error('driver ' + id + ' not found');
    }
}

function codeAddressToCoords(address, callback) {

    window.geocoder.geocode({ 'address': address }, function (results, status) {
        if (status == 'OK') {
            if (showLogs) {
                console.log('Geocode was successful for ' +  results[0].geometry.location.lat());}
            callback(null, results[0].geometry.location);
        } else {
            console.error('Geocode was not successful for the following reason: ' + status);
            callback(status);
        }
    });
}


function StartDrivingCar(id) {
    var driver = drivers.find(x => x.id === id);
    if (driver != null) {
        var path = [];

        if(driver.route == null)
        {
            return;
        }

        
        driver.route.routes[0].legs[0].steps.forEach(step => {
            path.push(...step.path);
        });

        if(driver.truckMarker == null)
        {

            var marker = new google.maps.Marker({
                position: new google.maps.LatLng(
                    path[0].lat(),
                    path[0].lng()
                ),
                label:
                {
                    text: driver.name,
                    color: "white",
                    fontSize: "12px",
                    fontWeight: "bold"
                }
            });

            marker.customData = {
                title: id,
                name: driver.name
            };

            driver.truckMarker = marker;
            markers.push(marker);

            //clusterMarkers(); //recluster markers

        }
        
        animateCar(driver.truckMarker, path);
    }else
    {
        console.error('driver ' + id + ' not found');
    }
}

function animateCar(marker, path) {
    var animationIndex = 0;
    var animationPath = [];
    var animationSpeed = 10; // pixels per frame, adjust as needed
    var name = marker.customData.name;
    animationPath = path;
    animationIndex = 0;

    window.requestAnimationFrame(function step() {
        // //clusterMarkers(); //recluster markers

        if (animationIndex >= animationPath.length) {
            return; // Exit when the end of the path is reached
        }
        
        // Set the marker's position
        marker.setPosition(animationPath[animationIndex]);
        if (animationIndex + 1 < animationPath.length) {
            
            const nextPos = animationPath[animationIndex + 1];
            const curPos = animationPath[animationIndex];
            
            const distance = Math.sqrt(
                (nextPos.lat() - curPos.lat()) ** 2 +
                (nextPos.lng() - curPos.lng()) ** 2
            );
            // Calculate a timeout based on the distance to the next point.
            const timeout = distance / animationSpeed;
            // clusterMarkers(); //recluster markers
            setTimeout(() => {
                animationIndex++;
                window.requestAnimationFrame(step);
                // clusterMarkers(); //recluster markers
            }, timeout);
            
        } else {
            animationIndex++;
            window.requestAnimationFrame(step);
        }
    });
}



class TruckDriver{
    route = [];
    id = '';
    name = '';
    truckMarker = null;

    constructor(id,name){
        this.id = id;
        this.name = name;
    }

    get truckMarker(){
        return this.truckMarker;
    }

    set truckMarker(truckMarker){
        this.truckMarker = truckMarker;
    }

    get route(){
        return this.route;
    }

    set route(route){
        this.route = route;
    }

    get id(){
        return this.id;
    }

    set id(id){
        this.id = id;
    }

    get name(){
        return this.name;
    }

    set name(name){
        this.name = name;
    }


}