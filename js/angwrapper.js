    // Initialize Angular
function init()
{
    console.log('Loading Angular');
    console.log('what the heck');
    
    var div = document.getElementById('controlAddIn');    
        
    var baseUrl = 'https://h2909571.stratoserver.net/HellebrekerPackages/3.TruckTrackerExternal/';

    var markerClusterUrl = baseUrl + 'js/markercluster.js';
    var scriptsUrl = baseUrl + 'js/scripts.js';

    //Load script function
    function loadScript(url, callback) {
        var script = document.createElement('script');
        script.onload = callback;
        script.src = url;
        document.head.appendChild(script);
    }

    loadScript(markerClusterUrl, function() {
        loadScript(scriptsUrl, function() {
            console.log('Google Maps Control Add-In initialized');
            initMap();
            Microsoft.Dynamics.NAV.InvokeExtensibilityMethod("ControlReady",[]);
        });
    });    
}

function initMap()
{
    window.geocoder = new google.maps.Geocoder();

    window.ctrlGoogleMap = new google.maps.Map(document.getElementById('controlAddIn'), {
        zoom: 3,
        center: { lat: 52.3443982, lng: 6.0491498 },
        scrollwheel: true,
        mapTypeId: google.maps.MapTypeId.HYBRID
    });    
}
