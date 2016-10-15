// ==UserScript==
// @id             iitc-plugin-draw-tools@breunigs
// @name           IITC plugin: draw tools
// @category       Layer
// @version        0.7.0.20161015.53955
// @namespace      https://github.com/jonatkins/ingress-intel-total-conversion
// @updateURL      none
// @downloadURL    none
// @description    [local-2016-10-15-053955] Allow drawing things onto the current map so you may plan your next move.
// @include        https://www.ingress.com/intel*
// @include        http://www.ingress.com/intel*
// @match          https://www.ingress.com/intel*
// @match          http://www.ingress.com/intel*
// @include        https://www.ingress.com/mission/*
// @include        http://www.ingress.com/mission/*
// @match          https://www.ingress.com/mission/*
// @match          http://www.ingress.com/mission/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};

//PLUGIN AUTHORS: writing a plugin outside of the IITC build environment? if so, delete these lines!!
//(leaving them in place might break the 'About IITC' page or break update checks)
plugin_info.buildName = 'local';
plugin_info.dateTimeVersion = '20161015.53955';
plugin_info.pluginId = 'draw-tools';
//END PLUGIN AUTHORS NOTE



// PLUGIN START ////////////////////////////////////////////////////////


// use own namespace for plugin
window.plugin.drawTools = function() {};

window.plugin.drawTools.loadExternals = function() {
  try { console.log('Loading leaflet.draw JS now'); } catch(e) {}
  /*
	Leaflet.draw, a plugin that adds drawing and editing tools to Leaflet powered maps.
	(c) 2012-2016, Jacob Toye, Smartrak, Leaflet

	https://github.com/Leaflet/Leaflet.draw
	http://leafletjs.com
*/
!function(t,e,i){L.drawVersion="0.3.0-dev",L.drawLocal={draw:{toolbar:{actions:{title:"Cancel drawing",text:"Cancel"},finish:{title:"Finish drawing",text:"Finish"},undo:{title:"Delete last point drawn",text:"Delete last point"},buttons:{polyline:"Draw a polyline",polygon:"Draw a polygon",rectangle:"Draw a rectangle",circle:"Draw a circle",marker:"Draw a marker"}},handlers:{circle:{tooltip:{start:"Click and drag to draw circle."},radius:"Radius"},marker:{tooltip:{start:"Click map to place marker."}},polygon:{tooltip:{start:"Click to start drawing shape.",cont:"Click to continue drawing shape.",end:"Click first point to close this shape."}},polyline:{error:"<strong>Error:</strong> shape edges cannot cross!",tooltip:{start:"Click to start drawing line.",cont:"Click to continue drawing line.",end:"Click last point to finish line."}},rectangle:{tooltip:{start:"Click and drag to draw rectangle."}},simpleshape:{tooltip:{end:"Release mouse to finish drawing."}}}},edit:{toolbar:{actions:{save:{title:"Save changes.",text:"Save"},cancel:{title:"Cancel editing, discards all changes.",text:"Cancel"}},buttons:{edit:"Edit layers.",editDisabled:"No layers to edit.",remove:"Delete layers.",removeDisabled:"No layers to delete."}},handlers:{edit:{tooltip:{text:"Drag handles, or marker to edit feature.",subtext:"Click cancel to undo changes."}},remove:{tooltip:{text:"Click on a feature to remove"}}}}},L.Draw={},L.Draw.Feature=L.Handler.extend({includes:L.Mixin.Events,initialize:function(t,e){this._map=t,this._container=t._container,this._overlayPane=t._panes.overlayPane,this._popupPane=t._panes.popupPane,e&&e.shapeOptions&&(e.shapeOptions=L.Util.extend({},this.options.shapeOptions,e.shapeOptions)),L.setOptions(this,e)},enable:function(){this._enabled||(L.Handler.prototype.enable.call(this),this.fire("enabled",{handler:this.type}),this._map.fire("draw:drawstart",{layerType:this.type}))},disable:function(){this._enabled&&(L.Handler.prototype.disable.call(this),this._map.fire("draw:drawstop",{layerType:this.type}),this.fire("disabled",{handler:this.type}))},addHooks:function(){var t=this._map;t&&(L.DomUtil.disableTextSelection(),t.getContainer().focus(),this._tooltip=new L.Tooltip(this._map),L.DomEvent.on(this._container,"keyup",this._cancelDrawing,this))},removeHooks:function(){this._map&&(L.DomUtil.enableTextSelection(),this._tooltip.dispose(),this._tooltip=null,L.DomEvent.off(this._container,"keyup",this._cancelDrawing,this))},setOptions:function(t){L.setOptions(this,t)},_fireCreatedEvent:function(t){this._map.fire("draw:created",{layer:t,layerType:this.type})},_cancelDrawing:function(t){this._map.fire("draw:canceled",{layerType:this.type}),27===t.keyCode&&this.disable()}}),L.Draw.Polyline=L.Draw.Feature.extend({statics:{TYPE:"polyline"},Poly:L.Polyline,options:{allowIntersection:!0,repeatMode:!1,drawError:{color:"#b00b00",timeout:2500},icon:new L.DivIcon({iconSize:new L.Point(8,8),className:"leaflet-div-icon leaflet-editing-icon"}),touchIcon:new L.DivIcon({iconSize:new L.Point(20,20),className:"leaflet-div-icon leaflet-editing-icon leaflet-touch-icon"}),guidelineDistance:20,maxGuideLineLength:4e3,shapeOptions:{stroke:!0,color:"#f06eaa",weight:4,opacity:.5,fill:!1,clickable:!0},metric:!0,feet:!0,showLength:!0,zIndexOffset:2e3},initialize:function(t,e){L.Browser.touch&&(this.options.icon=this.options.touchIcon),this.options.drawError.message=L.drawLocal.draw.handlers.polyline.error,e&&e.drawError&&(e.drawError=L.Util.extend({},this.options.drawError,e.drawError)),this.type=L.Draw.Polyline.TYPE,L.Draw.Feature.prototype.initialize.call(this,t,e)},addHooks:function(){L.Draw.Feature.prototype.addHooks.call(this),this._map&&(this._markers=[],this._markerGroup=new L.LayerGroup,this._map.addLayer(this._markerGroup),this._poly=new L.Polyline([],this.options.shapeOptions),this._tooltip.updateContent(this._getTooltipText()),this._mouseMarker||(this._mouseMarker=L.marker(this._map.getCenter(),{icon:L.divIcon({className:"leaflet-mouse-marker",iconAnchor:[20,20],iconSize:[40,40]}),opacity:0,zIndexOffset:this.options.zIndexOffset})),L.Browser.touch||this._map.on("mouseup",this._onMouseUp,this),this._mouseMarker.on("mousedown",this._onMouseDown,this).on("mouseout",this._onMouseOut,this).on("mouseup",this._onMouseUp,this).on("mousemove",this._onMouseMove,this).addTo(this._map),this._map.on("mouseup",this._onMouseUp,this).on("mousemove",this._onMouseMove,this).on("zoomlevelschange",this._onZoomEnd,this).on("click",this._onTouch,this).on("zoomend",this._onZoomEnd,this))},removeHooks:function(){L.Draw.Feature.prototype.removeHooks.call(this),this._clearHideErrorTimeout(),this._cleanUpShape(),this._map.removeLayer(this._markerGroup),delete this._markerGroup,delete this._markers,this._map.removeLayer(this._poly),delete this._poly,this._mouseMarker.off("mousedown",this._onMouseDown,this).off("mouseout",this._onMouseOut,this).off("mouseup",this._onMouseUp,this).off("mousemove",this._onMouseMove,this),this._map.removeLayer(this._mouseMarker),delete this._mouseMarker,this._clearGuides(),this._map.off("mouseup",this._onMouseUp,this).off("mousemove",this._onMouseMove,this).off("zoomlevelschange",this._onZoomEnd,this).off("zoomend",this._onZoomEnd,this).off("click",this._onTouch,this)},deleteLastVertex:function(){if(!(this._markers.length<=1)){var t=this._markers.pop(),e=this._poly,i=this._poly.spliceLatLngs(e.getLatLngs().length-1,1)[0];this._markerGroup.removeLayer(t),e.getLatLngs().length<2&&this._map.removeLayer(e),this._vertexChanged(i,!1)}},addVertex:function(t){var e=this._markers.length;return e>0&&!this.options.allowIntersection&&this._poly.newLatLngIntersects(t)?void this._showErrorTooltip():(this._errorShown&&this._hideErrorTooltip(),this._markers.push(this._createMarker(t)),this._poly.addLatLng(t),2===this._poly.getLatLngs().length&&this._map.addLayer(this._poly),void this._vertexChanged(t,!0))},completeShape:function(){this._markers.length<=1||(this._fireCreatedEvent(),this.disable(),this.options.repeatMode&&this.enable())},_finishShape:function(){var t=this._poly.newLatLngIntersects(this._poly.getLatLngs()[this._poly.getLatLngs().length-1]);return!this.options.allowIntersection&&t||!this._shapeIsValid()?void this._showErrorTooltip():(this._fireCreatedEvent(),this.disable(),void(this.options.repeatMode&&this.enable()))},_shapeIsValid:function(){return!0},_onZoomEnd:function(){null!==this._markers&&this._updateGuide()},_onMouseMove:function(t){var e=this._map.mouseEventToLayerPoint(t.originalEvent),i=this._map.layerPointToLatLng(e);this._currentLatLng=i,this._updateTooltip(i),this._updateGuide(e),this._mouseMarker.setLatLng(i),L.DomEvent.preventDefault(t.originalEvent)},_vertexChanged:function(t,e){this._map.fire("draw:drawvertex",{layers:this._markerGroup}),this._updateFinishHandler(),this._updateRunningMeasure(t,e),this._clearGuides(),this._updateTooltip()},_onMouseDown:function(t){var e=t.originalEvent;this._mouseDownOrigin=L.point(e.clientX,e.clientY)},_onMouseUp:function(e){if(this._mouseDownOrigin){var i=L.point(e.originalEvent.clientX,e.originalEvent.clientY).distanceTo(this._mouseDownOrigin);Math.abs(i)<9*(t.devicePixelRatio||1)&&this.addVertex(e.latlng)}this._mouseDownOrigin=null},_onTouch:function(t){L.Browser.touch&&(this._onMouseDown(t),this._onMouseUp(t))},_onMouseOut:function(){this._tooltip&&this._tooltip._onMouseOut.call(this._tooltip)},_updateFinishHandler:function(){var t=this._markers.length;t>1&&this._markers[t-1].on("click",this._finishShape,this),t>2&&this._markers[t-2].off("click",this._finishShape,this)},_createMarker:function(t){var e=new L.Marker(t,{icon:this.options.icon,zIndexOffset:2*this.options.zIndexOffset});return this._markerGroup.addLayer(e),e},_updateGuide:function(t){var e=this._markers?this._markers.length:0;e>0&&(t=t||this._map.latLngToLayerPoint(this._currentLatLng),this._clearGuides(),this._drawGuide(this._map.latLngToLayerPoint(this._markers[e-1].getLatLng()),t))},_updateTooltip:function(t){var e=this._getTooltipText();t&&this._tooltip.updatePosition(t),this._errorShown||this._tooltip.updateContent(e)},_drawGuide:function(t,e){var i,o,n,s=Math.floor(Math.sqrt(Math.pow(e.x-t.x,2)+Math.pow(e.y-t.y,2))),a=this.options.guidelineDistance,r=this.options.maxGuideLineLength,h=s>r?s-r:a;for(this._guidesContainer||(this._guidesContainer=L.DomUtil.create("div","leaflet-draw-guides",this._overlayPane));s>h;h+=this.options.guidelineDistance)i=h/s,o={x:Math.floor(t.x*(1-i)+i*e.x),y:Math.floor(t.y*(1-i)+i*e.y)},n=L.DomUtil.create("div","leaflet-draw-guide-dash",this._guidesContainer),n.style.backgroundColor=this._errorShown?this.options.drawError.color:this.options.shapeOptions.color,L.DomUtil.setPosition(n,o)},_updateGuideColor:function(t){if(this._guidesContainer)for(var e=0,i=this._guidesContainer.childNodes.length;i>e;e++)this._guidesContainer.childNodes[e].style.backgroundColor=t},_clearGuides:function(){if(this._guidesContainer)for(;this._guidesContainer.firstChild;)this._guidesContainer.removeChild(this._guidesContainer.firstChild)},_getTooltipText:function(){var t,e,i=this.options.showLength;return 0===this._markers.length?t={text:L.drawLocal.draw.handlers.polyline.tooltip.start}:(e=i?this._getMeasurementString():"",t=1===this._markers.length?{text:L.drawLocal.draw.handlers.polyline.tooltip.cont,subtext:e}:{text:L.drawLocal.draw.handlers.polyline.tooltip.end,subtext:e}),t},_updateRunningMeasure:function(t,e){var i,o,n=this._markers.length;1===this._markers.length?this._measurementRunningTotal=0:(i=n-(e?2:1),o=t.distanceTo(this._markers[i].getLatLng()),this._measurementRunningTotal+=o*(e?1:-1))},_getMeasurementString:function(){var t,e=this._currentLatLng,i=this._markers[this._markers.length-1].getLatLng();return t=this._measurementRunningTotal+e.distanceTo(i),L.GeometryUtil.readableDistance(t,this.options.metric,this.options.feet)},_showErrorTooltip:function(){this._errorShown=!0,this._tooltip.showAsError().updateContent({text:this.options.drawError.message}),this._updateGuideColor(this.options.drawError.color),this._poly.setStyle({color:this.options.drawError.color}),this._clearHideErrorTimeout(),this._hideErrorTimeout=setTimeout(L.Util.bind(this._hideErrorTooltip,this),this.options.drawError.timeout)},_hideErrorTooltip:function(){this._errorShown=!1,this._clearHideErrorTimeout(),this._tooltip.removeError().updateContent(this._getTooltipText()),this._updateGuideColor(this.options.shapeOptions.color),this._poly.setStyle({color:this.options.shapeOptions.color})},_clearHideErrorTimeout:function(){this._hideErrorTimeout&&(clearTimeout(this._hideErrorTimeout),this._hideErrorTimeout=null)},_cleanUpShape:function(){this._markers.length>1&&this._markers[this._markers.length-1].off("click",this._finishShape,this)},_fireCreatedEvent:function(){var t=new this.Poly(this._poly.getLatLngs(),this.options.shapeOptions);L.Draw.Feature.prototype._fireCreatedEvent.call(this,t)}}),L.Draw.Polygon=L.Draw.Polyline.extend({statics:{TYPE:"polygon"},Poly:L.Polygon,options:{showArea:!1,shapeOptions:{stroke:!0,color:"#f06eaa",weight:4,opacity:.5,fill:!0,fillColor:null,fillOpacity:.2,clickable:!0},metric:!0},initialize:function(t,e){L.Draw.Polyline.prototype.initialize.call(this,t,e),this.type=L.Draw.Polygon.TYPE},_updateFinishHandler:function(){var t=this._markers.length;1===t&&this._markers[0].on("click",this._finishShape,this),t>2&&(this._markers[t-1].on("dblclick",this._finishShape,this),t>3&&this._markers[t-2].off("dblclick",this._finishShape,this))},_getTooltipText:function(){var t,e;return 0===this._markers.length?t=L.drawLocal.draw.handlers.polygon.tooltip.start:this._markers.length<3?t=L.drawLocal.draw.handlers.polygon.tooltip.cont:(t=L.drawLocal.draw.handlers.polygon.tooltip.end,e=this._getMeasurementString()),{text:t,subtext:e}},_getMeasurementString:function(){var t=this._area;return t?L.GeometryUtil.readableArea(t,this.options.metric):null},_shapeIsValid:function(){return this._markers.length>=3},_vertexChanged:function(t,e){var i;!this.options.allowIntersection&&this.options.showArea&&(i=this._poly.getLatLngs(),this._area=L.GeometryUtil.geodesicArea(i)),L.Draw.Polyline.prototype._vertexChanged.call(this,t,e)},_cleanUpShape:function(){var t=this._markers.length;t>0&&(this._markers[0].off("click",this._finishShape,this),t>2&&this._markers[t-1].off("dblclick",this._finishShape,this))}}),L.SimpleShape={},L.Draw.SimpleShape=L.Draw.Feature.extend({options:{repeatMode:!1},initialize:function(t,e){this._endLabelText=L.drawLocal.draw.handlers.simpleshape.tooltip.end,L.Draw.Feature.prototype.initialize.call(this,t,e)},addHooks:function(){L.Draw.Feature.prototype.addHooks.call(this),this._map&&(this._mapDraggable=this._map.dragging.enabled(),this._mapDraggable&&this._map.dragging.disable(),this._container.style.cursor="crosshair",this._tooltip.updateContent({text:this._initialLabelText}),this._map.on("mousedown",this._onMouseDown,this).on("mousemove",this._onMouseMove,this).on("touchstart",this._onMouseDown,this).on("touchmove",this._onMouseMove,this))},removeHooks:function(){L.Draw.Feature.prototype.removeHooks.call(this),this._map&&(this._mapDraggable&&this._map.dragging.enable(),this._container.style.cursor="",this._map.off("mousedown",this._onMouseDown,this).off("mousemove",this._onMouseMove,this).off("touchstart",this._onMouseDown,this).off("touchmove",this._onMouseMove,this),L.DomEvent.off(e,"mouseup",this._onMouseUp,this),L.DomEvent.off(e,"touchend",this._onMouseUp,this),this._shape&&(this._map.removeLayer(this._shape),delete this._shape)),this._isDrawing=!1},_getTooltipText:function(){return{text:this._endLabelText}},_onMouseDown:function(t){this._isDrawing=!0,this._startLatLng=t.latlng,L.DomEvent.on(e,"mouseup",this._onMouseUp,this).on(e,"touchend",this._onMouseUp,this).preventDefault(t.originalEvent)},_onMouseMove:function(t){var e=t.latlng;this._tooltip.updatePosition(e),this._isDrawing&&(this._tooltip.updateContent(this._getTooltipText()),this._drawShape(e))},_onMouseUp:function(){this._shape&&this._fireCreatedEvent(),this.disable(),this.options.repeatMode&&this.enable()}}),L.Draw.Rectangle=L.Draw.SimpleShape.extend({statics:{TYPE:"rectangle"},options:{shapeOptions:{stroke:!0,color:"#f06eaa",weight:4,opacity:.5,fill:!0,fillColor:null,fillOpacity:.2,clickable:!0},metric:!0},initialize:function(t,e){this.type=L.Draw.Rectangle.TYPE,this._initialLabelText=L.drawLocal.draw.handlers.rectangle.tooltip.start,L.Draw.SimpleShape.prototype.initialize.call(this,t,e)},_drawShape:function(t){this._shape?this._shape.setBounds(new L.LatLngBounds(this._startLatLng,t)):(this._shape=new L.Rectangle(new L.LatLngBounds(this._startLatLng,t),this.options.shapeOptions),this._map.addLayer(this._shape))},_fireCreatedEvent:function(){var t=new L.Rectangle(this._shape.getBounds(),this.options.shapeOptions);L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this,t)},_getTooltipText:function(){var t,e,i,o=L.Draw.SimpleShape.prototype._getTooltipText.call(this),n=this._shape;return n&&(t=this._shape.getLatLngs(),e=L.GeometryUtil.geodesicArea(t),i=L.GeometryUtil.readableArea(e,this.options.metric)),{text:o.text,subtext:i}}}),L.Draw.Circle=L.Draw.SimpleShape.extend({statics:{TYPE:"circle"},options:{shapeOptions:{stroke:!0,color:"#f06eaa",weight:4,opacity:.5,fill:!0,fillColor:null,fillOpacity:.2,clickable:!0},showRadius:!0,metric:!0,feet:!0},initialize:function(t,e){this.type=L.Draw.Circle.TYPE,this._initialLabelText=L.drawLocal.draw.handlers.circle.tooltip.start,L.Draw.SimpleShape.prototype.initialize.call(this,t,e)},_drawShape:function(t){this._shape?this._shape.setRadius(this._startLatLng.distanceTo(t)):(this._shape=new L.Circle(this._startLatLng,this._startLatLng.distanceTo(t),this.options.shapeOptions),this._map.addLayer(this._shape))},_fireCreatedEvent:function(){var t=new L.Circle(this._startLatLng,this._shape.getRadius(),this.options.shapeOptions);L.Draw.SimpleShape.prototype._fireCreatedEvent.call(this,t)},_onMouseMove:function(t){var e,i=t.latlng,o=this.options.showRadius,n=this.options.metric;this._tooltip.updatePosition(i),this._isDrawing&&(this._drawShape(i),e=this._shape.getRadius().toFixed(1),this._tooltip.updateContent({text:this._endLabelText,subtext:o?L.drawLocal.draw.handlers.circle.radius+": "+L.GeometryUtil.readableDistance(e,n,this.options.feet):""}))}}),L.Draw.Marker=L.Draw.Feature.extend({statics:{TYPE:"marker"},options:{icon:new L.Icon.Default,repeatMode:!1,zIndexOffset:2e3},initialize:function(t,e){this.type=L.Draw.Marker.TYPE,L.Draw.Feature.prototype.initialize.call(this,t,e)},addHooks:function(){L.Draw.Feature.prototype.addHooks.call(this),this._map&&(this._tooltip.updateContent({text:L.drawLocal.draw.handlers.marker.tooltip.start}),this._mouseMarker||(this._mouseMarker=L.marker(this._map.getCenter(),{icon:L.divIcon({className:"leaflet-mouse-marker",iconAnchor:[20,20],iconSize:[40,40]}),opacity:0,zIndexOffset:this.options.zIndexOffset})),this._mouseMarker.on("click",this._onClick,this).addTo(this._map),this._map.on("mousemove",this._onMouseMove,this),this._map.on("click",this._onTouch,this))},removeHooks:function(){L.Draw.Feature.prototype.removeHooks.call(this),this._map&&(this._marker&&(this._marker.off("click",this._onClick,this),this._map.off("click",this._onClick,this).off("click",this._onTouch,this).removeLayer(this._marker),delete this._marker),this._mouseMarker.off("click",this._onClick,this),this._map.removeLayer(this._mouseMarker),delete this._mouseMarker,this._map.off("mousemove",this._onMouseMove,this))},_onMouseMove:function(t){var e=t.latlng;this._tooltip.updatePosition(e),this._mouseMarker.setLatLng(e),this._marker?(e=this._mouseMarker.getLatLng(),this._marker.setLatLng(e)):(this._marker=new L.Marker(e,{icon:this.options.icon,zIndexOffset:this.options.zIndexOffset}),this._marker.on("click",this._onClick,this),this._map.on("click",this._onClick,this).addLayer(this._marker))},_onClick:function(){this._fireCreatedEvent(),this.disable(),this.options.repeatMode&&this.enable()},_onTouch:function(t){this._onMouseMove(t),this._onClick()},_fireCreatedEvent:function(){var t=new L.Marker.Touch(this._marker.getLatLng(),{icon:this.options.icon});L.Draw.Feature.prototype._fireCreatedEvent.call(this,t)}}),L.Edit=L.Edit||{},L.Edit.Marker=L.Handler.extend({initialize:function(t,e){this._marker=t,L.setOptions(this,e)},addHooks:function(){var t=this._marker;t.dragging.enable(),t.on("dragend",this._onDragEnd,t),this._toggleMarkerHighlight()},removeHooks:function(){var t=this._marker;t.dragging.disable(),t.off("dragend",this._onDragEnd,t),this._toggleMarkerHighlight()},_onDragEnd:function(t){var e=t.target;e.edited=!0,this._map.fire("draw:editmove",{layer:e})},_toggleMarkerHighlight:function(){var t=this._marker._icon;t&&(t.style.display="none",L.DomUtil.hasClass(t,"leaflet-edit-marker-selected")?(L.DomUtil.removeClass(t,"leaflet-edit-marker-selected"),this._offsetMarker(t,-4)):(L.DomUtil.addClass(t,"leaflet-edit-marker-selected"),this._offsetMarker(t,4)),t.style.display="")},_offsetMarker:function(t,e){var i=parseInt(t.style.marginTop,10)-e,o=parseInt(t.style.marginLeft,10)-e;t.style.marginTop=i+"px",t.style.marginLeft=o+"px"}}),L.Marker.addInitHook(function(){L.Edit.Marker&&(this.editing=new L.Edit.Marker(this),this.options.editable&&this.editing.enable())}),L.Edit=L.Edit||{},L.Edit.Poly=L.Handler.extend({options:{},initialize:function(t,e){this.latlngs=[t._latlngs],t._holes&&(this.latlngs=this.latlngs.concat(t._holes)),this._poly=t,L.setOptions(this,e),this._poly.on("revert-edited",this._updateLatLngs,this)},_eachVertexHandler:function(t){for(var e=0;e<this._verticesHandlers.length;e++)t(this._verticesHandlers[e])},addHooks:function(){this._initHandlers(),this._eachVertexHandler(function(t){t.addHooks()})},removeHooks:function(){this._eachVertexHandler(function(t){t.removeHooks()})},updateMarkers:function(){this._eachVertexHandler(function(t){t.updateMarkers()})},_initHandlers:function(){this._verticesHandlers=[];for(var t=0;t<this.latlngs.length;t++)this._verticesHandlers.push(new L.Edit.PolyVerticesEdit(this._poly,this.latlngs[t],this.options))},_updateLatLngs:function(t){this.latlngs=[t.layer._latlngs],t.layer._holes&&(this.latlngs=this.latlngs.concat(t.layer._holes))}}),L.Edit.PolyVerticesEdit=L.Handler.extend({options:{icon:new L.DivIcon({iconSize:new L.Point(8,8),className:"leaflet-div-icon leaflet-editing-icon"}),touchIcon:new L.DivIcon({iconSize:new L.Point(20,20),className:"leaflet-div-icon leaflet-editing-icon leaflet-touch-icon"}),drawError:{color:"#b00b00",timeout:1e3}},initialize:function(t,e,i){L.Browser.touch&&(this.options.icon=this.options.touchIcon),this._poly=t,i&&i.drawError&&(i.drawError=L.Util.extend({},this.options.drawError,i.drawError)),this._latlngs=e,L.setOptions(this,i)},addHooks:function(){var t=this._poly;t instanceof L.Polygon||(t.options.fill=!1),t.setStyle(t.options.editing),this._poly._map&&(this._map=this._poly._map,this._markerGroup||this._initMarkers(),this._poly._map.addLayer(this._markerGroup))},removeHooks:function(){var t=this._poly;t.setStyle(t.options.original),t._map&&(t._map.removeLayer(this._markerGroup),delete this._markerGroup,delete this._markers)},updateMarkers:function(){this._markerGroup.clearLayers(),this._initMarkers()},_initMarkers:function(){this._markerGroup||(this._markerGroup=new L.LayerGroup),this._markers=[];var t,e,i,o,n=this._latlngs;for(t=0,i=n.length;i>t;t++)o=this._createMarker(n[t],t),o.on("click",this._onMarkerClick,this),this._markers.push(o);var s,a;for(t=0,e=i-1;i>t;e=t++)(0!==t||L.Polygon&&this._poly instanceof L.Polygon)&&(s=this._markers[e],a=this._markers[t],this._createMiddleMarker(s,a),this._updatePrevNext(s,a))},_createMarker:function(t,e){var i=new L.Marker.Touch(t,{draggable:!0,icon:this.options.icon});return i._origLatLng=t,i._index=e,i.on("dragstart",this._onMarkerDragStart,this).on("drag",this._onMarkerDrag,this).on("dragend",this._fireEdit,this).on("touchmove",this._onTouchMove,this).on("MSPointerMove",this._onTouchMove,this).on("touchend",this._fireEdit,this).on("MSPointerUp",this._fireEdit,this),this._markerGroup.addLayer(i),i},_onMarkerDragStart:function(){this._poly.fire("editstart")},_spliceLatLngs:function(){var t=[].splice.apply(this._latlngs,arguments);return this._poly._convertLatLngs(this._latlngs,!0),this._poly.redraw(),t},_removeMarker:function(t){var e=t._index;this._markerGroup.removeLayer(t),this._markers.splice(e,1),this._spliceLatLngs(e,1),this._updateIndexes(e,-1),t.off("dragstart",this._onMarkerDragStart,this).off("drag",this._onMarkerDrag,this).off("dragend",this._fireEdit,this).off("touchmove",this._onMarkerDrag,this).off("touchend",this._fireEdit,this).off("click",this._onMarkerClick,this).off("MSPointerMove",this._onTouchMove,this).off("MSPointerUp",this._fireEdit,this)},_fireEdit:function(){this._poly.edited=!0,this._poly.fire("edit"),this._poly._map.fire("draw:editvertex",{layers:this._markerGroup})},_onMarkerDrag:function(t){var e=t.target,i=this._poly;if(L.extend(e._origLatLng,e._latlng),e._middleLeft&&e._middleLeft.setLatLng(this._getMiddleLatLng(e._prev,e)),e._middleRight&&e._middleRight.setLatLng(this._getMiddleLatLng(e,e._next)),i.options.poly){var o=i._map._editTooltip;if(!i.options.poly.allowIntersection&&i.intersects()){var n=i.options.color;i.setStyle({color:this.options.drawError.color}),o&&o.updateContent({text:L.drawLocal.draw.handlers.polyline.error}),setTimeout(function(){i.setStyle({color:n}),o&&o.updateContent({text:L.drawLocal.edit.handlers.edit.tooltip.text,subtext:L.drawLocal.edit.handlers.edit.tooltip.subtext})},1e3),this._onMarkerClick(t)}}this._poly.redraw(),this._poly.fire("editdrag")},_onMarkerClick:function(t){var e=L.Polygon&&this._poly instanceof L.Polygon?4:3,i=t.target;this._latlngs.length<e||(this._removeMarker(i),this._updatePrevNext(i._prev,i._next),i._middleLeft&&this._markerGroup.removeLayer(i._middleLeft),i._middleRight&&this._markerGroup.removeLayer(i._middleRight),i._prev&&i._next?this._createMiddleMarker(i._prev,i._next):i._prev?i._next||(i._prev._middleRight=null):i._next._middleLeft=null,this._fireEdit())},_onTouchMove:function(t){var e=this._map.mouseEventToLayerPoint(t.originalEvent.touches[0]),i=this._map.layerPointToLatLng(e),o=t.target;L.extend(o._origLatLng,i),o._middleLeft&&o._middleLeft.setLatLng(this._getMiddleLatLng(o._prev,o)),o._middleRight&&o._middleRight.setLatLng(this._getMiddleLatLng(o,o._next)),this._poly.redraw(),this.updateMarkers()},_updateIndexes:function(t,e){this._markerGroup.eachLayer(function(i){i._index>t&&(i._index+=e)})},_createMiddleMarker:function(t,e){var i,o,n,s=this._getMiddleLatLng(t,e),a=this._createMarker(s);a.setOpacity(.6),t._middleRight=e._middleLeft=a,o=function(){var o=e._index;a._index=o,a.off("click",i,this).on("click",this._onMarkerClick,this),s.lat=a.getLatLng().lat,s.lng=a.getLatLng().lng,this._spliceLatLngs(o,0,s),this._markers.splice(o,0,a),a.setOpacity(1),this._updateIndexes(o,1),e._index++,this._updatePrevNext(t,a),this._updatePrevNext(a,e),this._poly.fire("editstart")},n=function(){a.off("dragstart",o,this),a.off("dragend",n,this),a.off("touchmove",o,this),this._createMiddleMarker(t,a),this._createMiddleMarker(a,e)},i=function(){o.call(this),n.call(this),this._fireEdit()},a.on("click",i,this).on("dragstart",o,this).on("dragend",n,this).on("touchmove",o,this),this._markerGroup.addLayer(a)},_updatePrevNext:function(t,e){t&&(t._next=e),e&&(e._prev=t)},_getMiddleLatLng:function(t,e){var i=this._poly._map,o=i.project(t.getLatLng()),n=i.project(e.getLatLng());return i.unproject(o._add(n)._divideBy(2))}}),L.Polyline.addInitHook(function(){this.editing||(L.Edit.Poly&&(this.editing=new L.Edit.Poly(this,this.options.poly),this.options.editable&&this.editing.enable()),this.on("add",function(){this.editing&&this.editing.enabled()&&this.editing.addHooks()}),this.on("remove",function(){this.editing&&this.editing.enabled()&&this.editing.removeHooks()}))}),L.Edit=L.Edit||{},L.Edit.SimpleShape=L.Handler.extend({options:{moveIcon:new L.DivIcon({iconSize:new L.Point(8,8),className:"leaflet-div-icon leaflet-editing-icon leaflet-edit-move"}),resizeIcon:new L.DivIcon({iconSize:new L.Point(8,8),className:"leaflet-div-icon leaflet-editing-icon leaflet-edit-resize"}),touchMoveIcon:new L.DivIcon({iconSize:new L.Point(20,20),className:"leaflet-div-icon leaflet-editing-icon leaflet-edit-move leaflet-touch-icon"}),touchResizeIcon:new L.DivIcon({iconSize:new L.Point(20,20),className:"leaflet-div-icon leaflet-editing-icon leaflet-edit-resize leaflet-touch-icon"})},initialize:function(t,e){L.Browser.touch&&(this.options.moveIcon=this.options.touchMoveIcon,this.options.resizeIcon=this.options.touchResizeIcon),this._shape=t,L.Util.setOptions(this,e)},addHooks:function(){var t=this._shape;this._shape._map&&(this._map=this._shape._map,t.setStyle(t.options.editing),t._map&&(this._map=t._map,this._markerGroup||this._initMarkers(),this._map.addLayer(this._markerGroup)))},removeHooks:function(){var t=this._shape;if(t.setStyle(t.options.original),t._map){this._unbindMarker(this._moveMarker);for(var e=0,i=this._resizeMarkers.length;i>e;e++)this._unbindMarker(this._resizeMarkers[e]);this._resizeMarkers=null,this._map.removeLayer(this._markerGroup),delete this._markerGroup}this._map=null},updateMarkers:function(){this._markerGroup.clearLayers(),this._initMarkers()},_initMarkers:function(){this._markerGroup||(this._markerGroup=new L.LayerGroup),this._createMoveMarker(),this._createResizeMarker()},_createMoveMarker:function(){},_createResizeMarker:function(){},_createMarker:function(t,e){var i=new L.Marker.Touch(t,{draggable:!0,icon:e,zIndexOffset:10});return this._bindMarker(i),this._markerGroup.addLayer(i),i},_bindMarker:function(t){t.on("dragstart",this._onMarkerDragStart,this).on("drag",this._onMarkerDrag,this).on("dragend",this._onMarkerDragEnd,this).on("touchstart",this._onTouchStart,this).on("touchmove",this._onTouchMove,this).on("MSPointerMove",this._onTouchMove,this).on("touchend",this._onTouchEnd,this).on("MSPointerUp",this._onTouchEnd,this)},_unbindMarker:function(t){t.off("dragstart",this._onMarkerDragStart,this).off("drag",this._onMarkerDrag,this).off("dragend",this._onMarkerDragEnd,this).off("touchstart",this._onTouchStart,this).off("touchmove",this._onTouchMove,this).off("MSPointerMove",this._onTouchMove,this).off("touchend",this._onTouchEnd,this).off("MSPointerUp",this._onTouchEnd,this)},_onMarkerDragStart:function(t){var e=t.target;e.setOpacity(0),this._shape.fire("editstart")},_fireEdit:function(){this._shape.edited=!0,this._shape.fire("edit")},_onMarkerDrag:function(t){var e=t.target,i=e.getLatLng();e===this._moveMarker?this._move(i):this._resize(i),this._shape.redraw(),this._shape.fire("editdrag")},_onMarkerDragEnd:function(t){var e=t.target;e.setOpacity(1),this._fireEdit()},_onTouchStart:function(t){if(L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this,t),"function"==typeof this._getCorners){var e=this._getCorners(),i=t.target,o=i._cornerIndex;i.setOpacity(0),this._oppositeCorner=e[(o+2)%4],this._toggleCornerMarkers(0,o)}this._shape.fire("editstart")},_onTouchMove:function(t){var e=this._map.mouseEventToLayerPoint(t.originalEvent.touches[0]),i=this._map.layerPointToLatLng(e),o=t.target;return o===this._moveMarker?this._move(i):this._resize(i),this._shape.redraw(),!1},_onTouchEnd:function(t){var e=t.target;e.setOpacity(1),this.updateMarkers(),this._fireEdit()},_move:function(){},_resize:function(){}}),L.Edit=L.Edit||{},L.Edit.Rectangle=L.Edit.SimpleShape.extend({_createMoveMarker:function(){var t=this._shape.getBounds(),e=t.getCenter();this._moveMarker=this._createMarker(e,this.options.moveIcon)},_createResizeMarker:function(){var t=this._getCorners();this._resizeMarkers=[];for(var e=0,i=t.length;i>e;e++)this._resizeMarkers.push(this._createMarker(t[e],this.options.resizeIcon)),this._resizeMarkers[e]._cornerIndex=e},_onMarkerDragStart:function(t){L.Edit.SimpleShape.prototype._onMarkerDragStart.call(this,t);var e=this._getCorners(),i=t.target,o=i._cornerIndex;this._oppositeCorner=e[(o+2)%4],this._toggleCornerMarkers(0,o)},_onMarkerDragEnd:function(t){var e,i,o=t.target;o===this._moveMarker&&(e=this._shape.getBounds(),i=e.getCenter(),o.setLatLng(i)),this._toggleCornerMarkers(1),this._repositionCornerMarkers(),L.Edit.SimpleShape.prototype._onMarkerDragEnd.call(this,t)},_move:function(t){for(var e,i=this._shape.getLatLngs(),o=this._shape.getBounds(),n=o.getCenter(),s=[],a=0,r=i.length;r>a;a++)e=[i[a].lat-n.lat,i[a].lng-n.lng],s.push([t.lat+e[0],t.lng+e[1]]);this._shape.setLatLngs(s),this._repositionCornerMarkers(),this._map.fire("draw:editmove",{layer:this._shape})},_resize:function(t){var e;this._shape.setBounds(L.latLngBounds(t,this._oppositeCorner)),e=this._shape.getBounds(),this._moveMarker.setLatLng(e.getCenter()),this._map.fire("draw:editresize",{layer:this._shape})},_getCorners:function(){var t=this._shape.getBounds(),e=t.getNorthWest(),i=t.getNorthEast(),o=t.getSouthEast(),n=t.getSouthWest();return[e,i,o,n]},_toggleCornerMarkers:function(t){for(var e=0,i=this._resizeMarkers.length;i>e;e++)this._resizeMarkers[e].setOpacity(t)},_repositionCornerMarkers:function(){for(var t=this._getCorners(),e=0,i=this._resizeMarkers.length;i>e;e++)this._resizeMarkers[e].setLatLng(t[e])}}),L.Rectangle.addInitHook(function(){L.Edit.Rectangle&&(this.editing=new L.Edit.Rectangle(this),this.options.editable&&this.editing.enable())}),L.Edit=L.Edit||{},L.Edit.Circle=L.Edit.SimpleShape.extend({_createMoveMarker:function(){var t=this._shape.getLatLng();this._moveMarker=this._createMarker(t,this.options.moveIcon)},_createResizeMarker:function(){var t=this._shape.getLatLng(),e=this._getResizeMarkerPoint(t);this._resizeMarkers=[],this._resizeMarkers.push(this._createMarker(e,this.options.resizeIcon))},_getResizeMarkerPoint:function(t){var e=this._shape._radius*Math.cos(Math.PI/4),i=this._map.project(t);return this._map.unproject([i.x+e,i.y-e])},_move:function(t){var e=this._getResizeMarkerPoint(t);this._resizeMarkers[0].setLatLng(e),this._shape.setLatLng(t),this._map.fire("draw:editmove",{layer:this._shape})},_resize:function(t){var e=this._moveMarker.getLatLng(),i=e.distanceTo(t);
this._shape.setRadius(i),this._map.fire("draw:editresize",{layer:this._shape})}}),L.Circle.addInitHook(function(){L.Edit.Circle&&(this.editing=new L.Edit.Circle(this),this.options.editable&&this.editing.enable()),this.on("add",function(){this.editing&&this.editing.enabled()&&this.editing.addHooks()}),this.on("remove",function(){this.editing&&this.editing.enabled()&&this.editing.removeHooks()})}),L.Map.mergeOptions({touchExtend:!0}),L.Map.TouchExtend=L.Handler.extend({initialize:function(t){this._map=t,this._container=t._container,this._pane=t._panes.overlayPane},addHooks:function(){L.DomEvent.on(this._container,"touchstart",this._onTouchStart,this),L.DomEvent.on(this._container,"touchend",this._onTouchEnd,this),L.DomEvent.on(this._container,"touchmove",this._onTouchMove,this),this._detectIE()?(L.DomEvent.on(this._container,"MSPointerDown",this._onTouchStart,this),L.DomEvent.on(this._container,"MSPointerUp",this._onTouchEnd,this),L.DomEvent.on(this._container,"MSPointerMove",this._onTouchMove,this),L.DomEvent.on(this._container,"MSPointerCancel",this._onTouchCancel,this)):(L.DomEvent.on(this._container,"touchcancel",this._onTouchCancel,this),L.DomEvent.on(this._container,"touchleave",this._onTouchLeave,this))},removeHooks:function(){L.DomEvent.off(this._container,"touchstart",this._onTouchStart),L.DomEvent.off(this._container,"touchend",this._onTouchEnd),L.DomEvent.off(this._container,"touchmove",this._onTouchMove),this._detectIE()?(L.DomEvent.off(this._container,"MSPointerDowm",this._onTouchStart),L.DomEvent.off(this._container,"MSPointerUp",this._onTouchEnd),L.DomEvent.off(this._container,"MSPointerMove",this._onTouchMove),L.DomEvent.off(this._container,"MSPointerCancel",this._onTouchCancel)):(L.DomEvent.off(this._container,"touchcancel",this._onTouchCancel),L.DomEvent.off(this._container,"touchleave",this._onTouchLeave))},_touchEvent:function(t,e){var i={};if("undefined"!=typeof t.touches){if(!t.touches.length)return;i=t.touches[0]}else{if("touch"!==t.pointerType)return;if(i=t,!this._filterClick(t))return}var o=this._map.mouseEventToContainerPoint(i),n=this._map.mouseEventToLayerPoint(i),s=this._map.layerPointToLatLng(n);this._map.fire(e,{latlng:s,layerPoint:n,containerPoint:o,pageX:i.pageX,pageY:i.pageY,originalEvent:t})},_filterClick:function(t){var e=t.timeStamp||t.originalEvent.timeStamp,i=L.DomEvent._lastClick&&e-L.DomEvent._lastClick;return i&&i>100&&500>i||t.target._simulatedClick&&!t._simulated?(L.DomEvent.stop(t),!1):(L.DomEvent._lastClick=e,!0)},_onTouchStart:function(t){if(this._map._loaded){var e="touchstart";this._touchEvent(t,e)}},_onTouchEnd:function(t){if(this._map._loaded){var e="touchend";this._touchEvent(t,e)}},_onTouchCancel:function(t){if(this._map._loaded){var e="touchcancel";this._detectIE()&&(e="pointercancel"),this._touchEvent(t,e)}},_onTouchLeave:function(t){if(this._map._loaded){var e="touchleave";this._touchEvent(t,e)}},_onTouchMove:function(t){if(this._map._loaded){var e="touchmove";this._touchEvent(t,e)}},_detectIE:function(){var e=t.navigator.userAgent,i=e.indexOf("MSIE ");if(i>0)return parseInt(e.substring(i+5,e.indexOf(".",i)),10);var o=e.indexOf("Trident/");if(o>0){var n=e.indexOf("rv:");return parseInt(e.substring(n+3,e.indexOf(".",n)),10)}var s=e.indexOf("Edge/");return s>0?parseInt(e.substring(s+5,e.indexOf(".",s)),10):!1}}),L.Map.addInitHook("addHandler","touchExtend",L.Map.TouchExtend),L.Marker.Touch=L.Marker.extend({_initInteraction:function(){if(this.options.clickable){var t=this._icon,e=["dblclick","mousedown","mouseover","mouseout","contextmenu","touchstart","touchend","touchmove"];this._detectIE?e.concat(["MSPointerDown","MSPointerUp","MSPointerMove","MSPointerCancel"]):e.concat(["touchcancel"]),L.DomUtil.addClass(t,"leaflet-clickable"),L.DomEvent.on(t,"click",this._onMouseClick,this),L.DomEvent.on(t,"keypress",this._onKeyPress,this);for(var i=0;i<e.length;i++)L.DomEvent.on(t,e[i],this._fireMouseEvent,this);L.Handler.MarkerDrag&&(this.dragging=new L.Handler.MarkerDrag(this),this.options.draggable&&this.dragging.enable())}},_detectIE:function(){var e=t.navigator.userAgent,i=e.indexOf("MSIE ");if(i>0)return parseInt(e.substring(i+5,e.indexOf(".",i)),10);var o=e.indexOf("Trident/");if(o>0){var n=e.indexOf("rv:");return parseInt(e.substring(n+3,e.indexOf(".",n)),10)}var s=e.indexOf("Edge/");return s>0?parseInt(e.substring(s+5,e.indexOf(".",s)),10):!1}}),L.LatLngUtil={cloneLatLngs:function(t){for(var e=[],i=0,o=t.length;o>i;i++)e.push(this.cloneLatLng(t[i]));return e},cloneLatLng:function(t){return L.latLng(t.lat,t.lng)}},L.GeometryUtil=L.extend(L.GeometryUtil||{},{geodesicArea:function(t){var e,i,o=t.length,n=0,s=L.LatLng.DEG_TO_RAD;if(o>2){for(var a=0;o>a;a++)e=t[a],i=t[(a+1)%o],n+=(i.lng-e.lng)*s*(2+Math.sin(e.lat*s)+Math.sin(i.lat*s));n=6378137*n*6378137/2}return Math.abs(n)},readableArea:function(t,e){var i;return e?i=t>=1e4?(1e-4*t).toFixed(2)+" ha":t.toFixed(2)+" m&sup2;":(t/=.836127,i=t>=3097600?(t/3097600).toFixed(2)+" mi&sup2;":t>=4840?(t/4840).toFixed(2)+" acres":Math.ceil(t)+" yd&sup2;"),i},readableDistance:function(t,e,i){var o;if(e)o=t>1e3?(t/1e3).toFixed(2)+" km":Math.ceil(t)+" m";else if(t*=1.09361,t>1760)o=(t/1760).toFixed(2)+" miles";else{var n=" yd";i&&(t=3*t,n=" ft"),o=Math.ceil(t)+n}return o}}),L.Util.extend(L.LineUtil,{segmentsIntersect:function(t,e,i,o){return this._checkCounterclockwise(t,i,o)!==this._checkCounterclockwise(e,i,o)&&this._checkCounterclockwise(t,e,i)!==this._checkCounterclockwise(t,e,o)},_checkCounterclockwise:function(t,e,i){return(i.y-t.y)*(e.x-t.x)>(e.y-t.y)*(i.x-t.x)}}),L.Polyline.include({intersects:function(){var t,e,i,o=this._originalPoints,n=o?o.length:0;if(this._tooFewPointsForIntersection())return!1;for(t=n-1;t>=3;t--)if(e=o[t-1],i=o[t],this._lineSegmentsIntersectsRange(e,i,t-2))return!0;return!1},newLatLngIntersects:function(t,e){return this._map?this.newPointIntersects(this._map.latLngToLayerPoint(t),e):!1},newPointIntersects:function(t,e){var i=this._originalPoints,o=i?i.length:0,n=i?i[o-1]:null,s=o-2;return this._tooFewPointsForIntersection(1)?!1:this._lineSegmentsIntersectsRange(n,t,s,e?1:0)},_tooFewPointsForIntersection:function(t){var e=this._originalPoints,i=e?e.length:0;return i+=t||0,!this._originalPoints||3>=i},_lineSegmentsIntersectsRange:function(t,e,i,o){var n,s,a=this._originalPoints;o=o||0;for(var r=i;r>o;r--)if(n=a[r-1],s=a[r],L.LineUtil.segmentsIntersect(t,e,n,s))return!0;return!1}}),L.Polygon.include({intersects:function(){var t,e,i,o,n,s=this._originalPoints;return this._tooFewPointsForIntersection()?!1:(t=L.Polyline.prototype.intersects.call(this))?!0:(e=s.length,i=s[0],o=s[e-1],n=e-2,this._lineSegmentsIntersectsRange(o,i,n,1))}}),L.Control.Draw=L.Control.extend({options:{position:"topleft",draw:{},edit:!1},initialize:function(t){if(L.version<"0.7")throw new Error("Leaflet.draw 0.2.3+ requires Leaflet 0.7.0+. Download latest from https://github.com/Leaflet/Leaflet/");L.Control.prototype.initialize.call(this,t);var e;this._toolbars={},L.DrawToolbar&&this.options.draw&&(e=new L.DrawToolbar(this.options.draw),this._toolbars[L.DrawToolbar.TYPE]=e,this._toolbars[L.DrawToolbar.TYPE].on("enable",this._toolbarEnabled,this)),L.EditToolbar&&this.options.edit&&(e=new L.EditToolbar(this.options.edit),this._toolbars[L.EditToolbar.TYPE]=e,this._toolbars[L.EditToolbar.TYPE].on("enable",this._toolbarEnabled,this)),L.toolbar=this},onAdd:function(t){var e,i=L.DomUtil.create("div","leaflet-draw"),o=!1,n="leaflet-draw-toolbar-top";for(var s in this._toolbars)this._toolbars.hasOwnProperty(s)&&(e=this._toolbars[s].addToolbar(t),e&&(o||(L.DomUtil.hasClass(e,n)||L.DomUtil.addClass(e.childNodes[0],n),o=!0),i.appendChild(e)));return i},onRemove:function(){for(var t in this._toolbars)this._toolbars.hasOwnProperty(t)&&this._toolbars[t].removeToolbar()},setDrawingOptions:function(t){for(var e in this._toolbars)this._toolbars[e]instanceof L.DrawToolbar&&this._toolbars[e].setOptions(t)},_toolbarEnabled:function(t){var e=t.target;for(var i in this._toolbars)this._toolbars[i]!==e&&this._toolbars[i].disable()}}),L.Map.mergeOptions({drawControlTooltips:!0,drawControl:!1}),L.Map.addInitHook(function(){this.options.drawControl&&(this.drawControl=new L.Control.Draw,this.addControl(this.drawControl))}),L.Toolbar=L.Class.extend({includes:[L.Mixin.Events],initialize:function(t){L.setOptions(this,t),this._modes={},this._actionButtons=[],this._activeMode=null},enabled:function(){return null!==this._activeMode},disable:function(){this.enabled()&&this._activeMode.handler.disable()},addToolbar:function(t){var e,i=L.DomUtil.create("div","leaflet-draw-section"),o=0,n=this._toolbarClass||"",s=this.getModeHandlers(t);for(this._toolbarContainer=L.DomUtil.create("div","leaflet-draw-toolbar leaflet-bar"),this._map=t,e=0;e<s.length;e++)s[e].enabled&&this._initModeHandler(s[e].handler,this._toolbarContainer,o++,n,s[e].title);return o?(this._lastButtonIndex=--o,this._actionsContainer=L.DomUtil.create("ul","leaflet-draw-actions"),i.appendChild(this._toolbarContainer),i.appendChild(this._actionsContainer),i):void 0},removeToolbar:function(){for(var t in this._modes)this._modes.hasOwnProperty(t)&&(this._disposeButton(this._modes[t].button,this._modes[t].handler.enable,this._modes[t].handler),this._modes[t].handler.disable(),this._modes[t].handler.off("enabled",this._handlerActivated,this).off("disabled",this._handlerDeactivated,this));this._modes={};for(var e=0,i=this._actionButtons.length;i>e;e++)this._disposeButton(this._actionButtons[e].button,this._actionButtons[e].callback,this);this._actionButtons=[],this._actionsContainer=null},_initModeHandler:function(t,e,i,o,n){var s=t.type;this._modes[s]={},this._modes[s].handler=t,this._modes[s].button=this._createButton({type:s,title:n,className:o+"-"+s,container:e,callback:this._modes[s].handler.enable,context:this._modes[s].handler}),this._modes[s].buttonIndex=i,this._modes[s].handler.on("enabled",this._handlerActivated,this).on("disabled",this._handlerDeactivated,this)},_createButton:function(t){var e=L.DomUtil.create("a",t.className||"",t.container);return e.href="#",t.text&&(e.innerHTML=t.text),t.title&&(e.title=t.title),L.DomEvent.on(e,"click",L.DomEvent.stopPropagation).on(e,"mousedown",L.DomEvent.stopPropagation).on(e,"dblclick",L.DomEvent.stopPropagation).on(e,"click",L.DomEvent.preventDefault).on(e,"click",t.callback,t.context),e},_disposeButton:function(t,e){L.DomEvent.off(t,"click",L.DomEvent.stopPropagation).off(t,"mousedown",L.DomEvent.stopPropagation).off(t,"dblclick",L.DomEvent.stopPropagation).off(t,"click",L.DomEvent.preventDefault).off(t,"click",e)},_handlerActivated:function(t){this.disable(),this._activeMode=this._modes[t.handler],L.DomUtil.addClass(this._activeMode.button,"leaflet-draw-toolbar-button-enabled"),this._showActionsToolbar(),this.fire("enable")},_handlerDeactivated:function(){this._hideActionsToolbar(),L.DomUtil.removeClass(this._activeMode.button,"leaflet-draw-toolbar-button-enabled"),this._activeMode=null,this.fire("disable")},_createActions:function(t){var e,i,o,n,s=this._actionsContainer,a=this.getActions(t),r=a.length;for(i=0,o=this._actionButtons.length;o>i;i++)this._disposeButton(this._actionButtons[i].button,this._actionButtons[i].callback);for(this._actionButtons=[];s.firstChild;)s.removeChild(s.firstChild);for(var h=0;r>h;h++)"enabled"in a[h]&&!a[h].enabled||(e=L.DomUtil.create("li","",s),n=this._createButton({title:a[h].title,text:a[h].text,container:e,callback:a[h].callback,context:a[h].context}),this._actionButtons.push({button:n,callback:a[h].callback}))},_showActionsToolbar:function(){var t=this._activeMode.buttonIndex,e=this._lastButtonIndex,i=this._activeMode.button.offsetTop-1;this._createActions(this._activeMode.handler),this._actionsContainer.style.top=i+"px",0===t&&(L.DomUtil.addClass(this._toolbarContainer,"leaflet-draw-toolbar-notop"),L.DomUtil.addClass(this._actionsContainer,"leaflet-draw-actions-top")),t===e&&(L.DomUtil.addClass(this._toolbarContainer,"leaflet-draw-toolbar-nobottom"),L.DomUtil.addClass(this._actionsContainer,"leaflet-draw-actions-bottom")),this._actionsContainer.style.display="block"},_hideActionsToolbar:function(){this._actionsContainer.style.display="none",L.DomUtil.removeClass(this._toolbarContainer,"leaflet-draw-toolbar-notop"),L.DomUtil.removeClass(this._toolbarContainer,"leaflet-draw-toolbar-nobottom"),L.DomUtil.removeClass(this._actionsContainer,"leaflet-draw-actions-top"),L.DomUtil.removeClass(this._actionsContainer,"leaflet-draw-actions-bottom")}}),L.Tooltip=L.Class.extend({initialize:function(t){this._map=t,this._popupPane=t._panes.popupPane,this._container=t.options.drawControlTooltips?L.DomUtil.create("div","leaflet-draw-tooltip",this._popupPane):null,this._singleLineLabel=!1,this._map.on("mouseout",this._onMouseOut,this)},dispose:function(){this._map.off("mouseout",this._onMouseOut,this),this._container&&(this._popupPane.removeChild(this._container),this._container=null)},updateContent:function(t){return this._container?(t.subtext=t.subtext||"",0!==t.subtext.length||this._singleLineLabel?t.subtext.length>0&&this._singleLineLabel&&(L.DomUtil.removeClass(this._container,"leaflet-draw-tooltip-single"),this._singleLineLabel=!1):(L.DomUtil.addClass(this._container,"leaflet-draw-tooltip-single"),this._singleLineLabel=!0),this._container.innerHTML=(t.subtext.length>0?'<span class="leaflet-draw-tooltip-subtext">'+t.subtext+"</span><br />":"")+"<span>"+t.text+"</span>",this):this},updatePosition:function(t){var e=this._map.latLngToLayerPoint(t),i=this._container;return this._container&&(i.style.visibility="inherit",L.DomUtil.setPosition(i,e)),this},showAsError:function(){return this._container&&L.DomUtil.addClass(this._container,"leaflet-error-draw-tooltip"),this},removeError:function(){return this._container&&L.DomUtil.removeClass(this._container,"leaflet-error-draw-tooltip"),this},_onMouseOut:function(){this._container&&(this._container.style.visibility="hidden")}}),L.DrawToolbar=L.Toolbar.extend({statics:{TYPE:"draw"},options:{polyline:{},polygon:{},rectangle:{},circle:{},marker:{}},initialize:function(t){for(var e in this.options)this.options.hasOwnProperty(e)&&t[e]&&(t[e]=L.extend({},this.options[e],t[e]));this._toolbarClass="leaflet-draw-draw",L.Toolbar.prototype.initialize.call(this,t)},getModeHandlers:function(t){return[{enabled:this.options.polyline,handler:new L.Draw.Polyline(t,this.options.polyline),title:L.drawLocal.draw.toolbar.buttons.polyline},{enabled:this.options.polygon,handler:new L.Draw.Polygon(t,this.options.polygon),title:L.drawLocal.draw.toolbar.buttons.polygon},{enabled:this.options.rectangle,handler:new L.Draw.Rectangle(t,this.options.rectangle),title:L.drawLocal.draw.toolbar.buttons.rectangle},{enabled:this.options.circle,handler:new L.Draw.Circle(t,this.options.circle),title:L.drawLocal.draw.toolbar.buttons.circle},{enabled:this.options.marker,handler:new L.Draw.Marker(t,this.options.marker),title:L.drawLocal.draw.toolbar.buttons.marker}]},getActions:function(t){return[{enabled:t.completeShape,title:L.drawLocal.draw.toolbar.finish.title,text:L.drawLocal.draw.toolbar.finish.text,callback:t.completeShape,context:t},{enabled:t.deleteLastVertex,title:L.drawLocal.draw.toolbar.undo.title,text:L.drawLocal.draw.toolbar.undo.text,callback:t.deleteLastVertex,context:t},{title:L.drawLocal.draw.toolbar.actions.title,text:L.drawLocal.draw.toolbar.actions.text,callback:this.disable,context:this}]},setOptions:function(t){L.setOptions(this,t);for(var e in this._modes)this._modes.hasOwnProperty(e)&&t.hasOwnProperty(e)&&this._modes[e].handler.setOptions(t[e])}}),L.EditToolbar=L.Toolbar.extend({statics:{TYPE:"edit"},options:{edit:{selectedPathOptions:{dashArray:"10, 10",fill:!0,fillColor:"#fe57a1",fillOpacity:.1,maintainColor:!1}},remove:{},poly:null,featureGroup:null},initialize:function(t){t.edit&&("undefined"==typeof t.edit.selectedPathOptions&&(t.edit.selectedPathOptions=this.options.edit.selectedPathOptions),t.edit.selectedPathOptions=L.extend({},this.options.edit.selectedPathOptions,t.edit.selectedPathOptions)),t.remove&&(t.remove=L.extend({},this.options.remove,t.remove)),t.poly&&(t.poly=L.extend({},this.options.poly,t.poly)),this._toolbarClass="leaflet-draw-edit",L.Toolbar.prototype.initialize.call(this,t),this._selectedFeatureCount=0},getModeHandlers:function(t){var e=this.options.featureGroup;return[{enabled:this.options.edit,handler:new L.EditToolbar.Edit(t,{featureGroup:e,selectedPathOptions:this.options.edit.selectedPathOptions,poly:this.options.poly}),title:L.drawLocal.edit.toolbar.buttons.edit},{enabled:this.options.remove,handler:new L.EditToolbar.Delete(t,{featureGroup:e}),title:L.drawLocal.edit.toolbar.buttons.remove}]},getActions:function(){return[{title:L.drawLocal.edit.toolbar.actions.save.title,text:L.drawLocal.edit.toolbar.actions.save.text,callback:this._save,context:this},{title:L.drawLocal.edit.toolbar.actions.cancel.title,text:L.drawLocal.edit.toolbar.actions.cancel.text,callback:this.disable,context:this}]},addToolbar:function(t){var e=L.Toolbar.prototype.addToolbar.call(this,t);return this._checkDisabled(),this.options.featureGroup.on("layeradd layerremove",this._checkDisabled,this),e},removeToolbar:function(){this.options.featureGroup.off("layeradd layerremove",this._checkDisabled,this),L.Toolbar.prototype.removeToolbar.call(this)},disable:function(){this.enabled()&&(this._activeMode.handler.revertLayers(),L.Toolbar.prototype.disable.call(this))},_save:function(){this._activeMode.handler.save(),this._activeMode.handler.disable()},_checkDisabled:function(){var t,e=this.options.featureGroup,i=0!==e.getLayers().length;this.options.edit&&(t=this._modes[L.EditToolbar.Edit.TYPE].button,i?L.DomUtil.removeClass(t,"leaflet-disabled"):L.DomUtil.addClass(t,"leaflet-disabled"),t.setAttribute("title",i?L.drawLocal.edit.toolbar.buttons.edit:L.drawLocal.edit.toolbar.buttons.editDisabled)),this.options.remove&&(t=this._modes[L.EditToolbar.Delete.TYPE].button,i?L.DomUtil.removeClass(t,"leaflet-disabled"):L.DomUtil.addClass(t,"leaflet-disabled"),t.setAttribute("title",i?L.drawLocal.edit.toolbar.buttons.remove:L.drawLocal.edit.toolbar.buttons.removeDisabled))}}),L.EditToolbar.Edit=L.Handler.extend({statics:{TYPE:"edit"},includes:L.Mixin.Events,initialize:function(t,e){if(L.Handler.prototype.initialize.call(this,t),L.setOptions(this,e),this._featureGroup=e.featureGroup,!(this._featureGroup instanceof L.FeatureGroup))throw new Error("options.featureGroup must be a L.FeatureGroup");this._uneditedLayerProps={},this.type=L.EditToolbar.Edit.TYPE},enable:function(){!this._enabled&&this._hasAvailableLayers()&&(this.fire("enabled",{handler:this.type}),this._map.fire("draw:editstart",{handler:this.type}),L.Handler.prototype.enable.call(this),this._featureGroup.on("layeradd",this._enableLayerEdit,this).on("layerremove",this._disableLayerEdit,this))},disable:function(){this._enabled&&(this._featureGroup.off("layeradd",this._enableLayerEdit,this).off("layerremove",this._disableLayerEdit,this),L.Handler.prototype.disable.call(this),this._map.fire("draw:editstop",{handler:this.type}),this.fire("disabled",{handler:this.type}))},addHooks:function(){var t=this._map;t&&(t.getContainer().focus(),this._featureGroup.eachLayer(this._enableLayerEdit,this),this._tooltip=new L.Tooltip(this._map),this._tooltip.updateContent({text:L.drawLocal.edit.handlers.edit.tooltip.text,subtext:L.drawLocal.edit.handlers.edit.tooltip.subtext}),t._editTooltip=this._tooltip,this._updateTooltip(),this._map.on("mousemove",this._onMouseMove,this).on("touchmove",this._onMouseMove,this).on("MSPointerMove",this._onMouseMove,this).on("click",this._editStyle,this).on("draw:editvertex",this._updateTooltip,this))},removeHooks:function(){this._map&&(this._featureGroup.eachLayer(this._disableLayerEdit,this),this._uneditedLayerProps={},this._tooltip.dispose(),this._tooltip=null,this._map.off("mousemove",this._onMouseMove,this).off("touchmove",this._onMouseMove,this).off("MSPointerMove",this._onMouseMove,this).off("click",this._editStyle,this).off("draw:editvertex",this._updateTooltip,this))},revertLayers:function(){this._featureGroup.eachLayer(function(t){this._revertLayer(t)},this)},save:function(){var t=new L.LayerGroup;this._featureGroup.eachLayer(function(e){e.edited&&(t.addLayer(e),e.edited=!1)}),this._map.fire("draw:edited",{layers:t})},_backupLayer:function(t){var e=L.Util.stamp(t);this._uneditedLayerProps[e]||(t instanceof L.Polyline||t instanceof L.Polygon||t instanceof L.Rectangle?this._uneditedLayerProps[e]={latlngs:L.LatLngUtil.cloneLatLngs(t.getLatLngs())}:t instanceof L.Circle?this._uneditedLayerProps[e]={latlng:L.LatLngUtil.cloneLatLng(t.getLatLng()),radius:t.getRadius()}:t instanceof L.Marker&&(this._uneditedLayerProps[e]={latlng:L.LatLngUtil.cloneLatLng(t.getLatLng())}))},_getTooltipText:function(){return{text:L.drawLocal.edit.handlers.edit.tooltip.text,subtext:L.drawLocal.edit.handlers.edit.tooltip.subtext}},_updateTooltip:function(){this._tooltip.updateContent(this._getTooltipText())},_revertLayer:function(t){var e=L.Util.stamp(t);t.edited=!1,this._uneditedLayerProps.hasOwnProperty(e)&&(t instanceof L.Polyline||t instanceof L.Polygon||t instanceof L.Rectangle?t.setLatLngs(this._uneditedLayerProps[e].latlngs):t instanceof L.Circle?(t.setLatLng(this._uneditedLayerProps[e].latlng),t.setRadius(this._uneditedLayerProps[e].radius)):t instanceof L.Marker&&t.setLatLng(this._uneditedLayerProps[e].latlng),t.fire("revert-edited",{layer:t}))},_enableLayerEdit:function(t){var e,i,o=t.layer||t.target||t;this._backupLayer(o),this.options.poly&&(i=L.Util.extend({},this.options.poly),o.options.poly=i),this.options.selectedPathOptions&&(e=L.Util.extend({},this.options.selectedPathOptions),e.maintainColor&&(e.color=o.options.color,e.fillColor=o.options.fillColor),o.options.original=L.extend({},o.options),o.options.editing=e),this.isMarker?(o.dragging.enable(),o.on("dragend",this._onMarkerDragEnd).on("touchmove",this._onTouchMove,this).on("MSPointerMove",this._onTouchMove,this).on("touchend",this._onMarkerDragEnd,this).on("MSPointerUp",this._onMarkerDragEnd,this)):o.editing.enable()},_disableLayerEdit:function(t){var e=t.layer||t.target||t;e.edited=!1,e.editing.disable(),delete e.options.editing,delete e.options.original,this._selectedPathOptions&&(e instanceof L.Marker?this._toggleMarkerHighlight(e):(e.setStyle(e.options.previousOptions),delete e.options.previousOptions)),e instanceof L.Marker?(e.dragging.disable(),e.off("dragend",this._onMarkerDragEnd,this).off("touchmove",this._onTouchMove,this).off("MSPointerMove",this._onTouchMove,this).off("touchend",this._onMarkerDragEnd,this).off("MSPointerUp",this._onMarkerDragEnd,this)):e.editing.disable()},_onMouseMove:function(t){this._tooltip.updatePosition(t.latlng)},_onTouchMove:function(t){var e=t.originalEvent.changedTouches[0],i=this._map.mouseEventToLayerPoint(e),o=this._map.layerPointToLatLng(i);t.target.setLatLng(o)},_hasAvailableLayers:function(){return 0!==this._featureGroup.getLayers().length}}),L.EditToolbar.Delete=L.Handler.extend({statics:{TYPE:"remove"},includes:L.Mixin.Events,initialize:function(t,e){if(L.Handler.prototype.initialize.call(this,t),L.Util.setOptions(this,e),this._deletableLayers=this.options.featureGroup,!(this._deletableLayers instanceof L.FeatureGroup))throw new Error("options.featureGroup must be a L.FeatureGroup");this.type=L.EditToolbar.Delete.TYPE},enable:function(){!this._enabled&&this._hasAvailableLayers()&&(this.fire("enabled",{handler:this.type}),this._map.fire("draw:deletestart",{handler:this.type}),L.Handler.prototype.enable.call(this),this._deletableLayers.on("layeradd",this._enableLayerDelete,this).on("layerremove",this._disableLayerDelete,this))},disable:function(){this._enabled&&(this._deletableLayers.off("layeradd",this._enableLayerDelete,this).off("layerremove",this._disableLayerDelete,this),L.Handler.prototype.disable.call(this),this._map.fire("draw:deletestop",{handler:this.type}),this.fire("disabled",{handler:this.type}))},addHooks:function(){var t=this._map;t&&(t.getContainer().focus(),this._deletableLayers.eachLayer(this._enableLayerDelete,this),this._deletedLayers=new L.LayerGroup,this._tooltip=new L.Tooltip(this._map),this._tooltip.updateContent({text:L.drawLocal.edit.handlers.remove.tooltip.text}),this._map.on("mousemove",this._onMouseMove,this))},removeHooks:function(){this._map&&(this._deletableLayers.eachLayer(this._disableLayerDelete,this),this._deletedLayers=null,this._tooltip.dispose(),this._tooltip=null,this._map.off("mousemove",this._onMouseMove,this))},revertLayers:function(){this._deletedLayers.eachLayer(function(t){this._deletableLayers.addLayer(t),t.fire("revert-deleted",{layer:t})},this)},save:function(){this._map.fire("draw:deleted",{layers:this._deletedLayers})},_enableLayerDelete:function(t){var e=t.layer||t.target||t;e.on("click",this._removeLayer,this)},_disableLayerDelete:function(t){var e=t.layer||t.target||t;e.off("click",this._removeLayer,this),this._deletedLayers.removeLayer(e)},_removeLayer:function(t){var e=t.layer||t.target||t;this._deletableLayers.removeLayer(e),this._deletedLayers.addLayer(e),e.fire("deleted")},_onMouseMove:function(t){this._tooltip.updatePosition(t.latlng)},_hasAvailableLayers:function(){return 0!==this._deletableLayers.getLayers().length}})}(window,document);
  // Spectrum Colorpicker v1.2.0
// https://github.com/bgrins/spectrum
// Author: Brian Grinstead
// License: MIT

(function (window, $, undefined) {
    var defaultOpts = {

        // Callbacks
        beforeShow: noop,
        move: noop,
        change: noop,
        show: noop,
        hide: noop,

        // Options
        color: false,
        flat: false,
        showInput: false,
        allowEmpty: false,
        showButtons: true,
        clickoutFiresChange: false,
        showInitial: false,
        showPalette: false,
        showPaletteOnly: false,
        showSelectionPalette: true,
        localStorageKey: false,
        appendTo: "body",
        maxSelectionSize: 7,
        cancelText: "cancel",
        chooseText: "choose",
        preferredFormat: false,
        className: "",
        showAlpha: false,
        theme: "sp-light",
        palette: ['fff', '000'],
        selectionPalette: [],
        disabled: false
    },
    spectrums = [],
    IE = !!/msie/i.exec( window.navigator.userAgent ),
    rgbaSupport = (function() {
        function contains( str, substr ) {
            return !!~('' + str).indexOf(substr);
        }

        var elem = document.createElement('div');
        var style = elem.style;
        style.cssText = 'background-color:rgba(0,0,0,.5)';
        return contains(style.backgroundColor, 'rgba') || contains(style.backgroundColor, 'hsla');
    })(),
    inputTypeColorSupport = (function() {
        var colorInput = $("<input type='color' value='!' />")[0];
        return colorInput.type === "color" && colorInput.value !== "!";
    })(),
    replaceInput = [
        "<div class='sp-replacer'>",
            "<div class='sp-preview'><div class='sp-preview-inner'></div></div>",
            "<div class='sp-dd'>&#9660;</div>",
        "</div>"
    ].join(''),
    markup = (function () {

        // IE does not support gradients with multiple stops, so we need to simulate
        //  that for the rainbow slider with 8 divs that each have a single gradient
        var gradientFix = "";
        if (IE) {
            for (var i = 1; i <= 6; i++) {
                gradientFix += "<div class='sp-" + i + "'></div>";
            }
        }

        return [
            "<div class='sp-container sp-hidden'>",
                "<div class='sp-palette-container'>",
                    "<div class='sp-palette sp-thumb sp-cf'></div>",
                "</div>",
                "<div class='sp-picker-container'>",
                    "<div class='sp-top sp-cf'>",
                        "<div class='sp-fill'></div>",
                        "<div class='sp-top-inner'>",
                            "<div class='sp-color'>",
                                "<div class='sp-sat'>",
                                    "<div class='sp-val'>",
                                        "<div class='sp-dragger'></div>",
                                    "</div>",
                                "</div>",
                            "</div>",
                            "<div class='sp-clear sp-clear-display' title='Clear Color Selection'>",
                            "</div>",
                            "<div class='sp-hue'>",
                                "<div class='sp-slider'></div>",
                                gradientFix,
                            "</div>",
                        "</div>",
                        "<div class='sp-alpha'><div class='sp-alpha-inner'><div class='sp-alpha-handle'></div></div></div>",
                    "</div>",
                    "<div class='sp-input-container sp-cf'>",
                        "<input class='sp-input' type='text' spellcheck='false'  />",
                    "</div>",
                    "<div class='sp-initial sp-thumb sp-cf'></div>",
                    "<div class='sp-button-container sp-cf'>",
                        "<a class='sp-cancel' href='#'></a>",
                        "<button class='sp-choose'></button>",
                    "</div>",
                "</div>",
            "</div>"
        ].join("");
    })();

    function paletteTemplate (p, color, className) {
        var html = [];
        for (var i = 0; i < p.length; i++) {
            var current = p[i];
            if(current) {
                var tiny = tinycolor(current);
                var c = tiny.toHsl().l < 0.5 ? "sp-thumb-el sp-thumb-dark" : "sp-thumb-el sp-thumb-light";
                c += (tinycolor.equals(color, current)) ? " sp-thumb-active" : "";

                var swatchStyle = rgbaSupport ? ("background-color:" + tiny.toRgbString()) : "filter:" + tiny.toFilter();
                html.push('<span title="' + tiny.toRgbString() + '" data-color="' + tiny.toRgbString() + '" class="' + c + '"><span class="sp-thumb-inner" style="' + swatchStyle + ';" /></span>');
            } else {
                var cls = 'sp-clear-display';
                html.push('<span title="No Color Selected" data-color="" style="background-color:transparent;" class="' + cls + '"></span>');
            }
        }
        return "<div class='sp-cf " + className + "'>" + html.join('') + "</div>";
    }

    function hideAll() {
        for (var i = 0; i < spectrums.length; i++) {
            if (spectrums[i]) {
                spectrums[i].hide();
            }
        }
    }

    function instanceOptions(o, callbackContext) {
        var opts = $.extend({}, defaultOpts, o);
        opts.callbacks = {
            'move': bind(opts.move, callbackContext),
            'change': bind(opts.change, callbackContext),
            'show': bind(opts.show, callbackContext),
            'hide': bind(opts.hide, callbackContext),
            'beforeShow': bind(opts.beforeShow, callbackContext)
        };

        return opts;
    }

    function spectrum(element, o) {

        var opts = instanceOptions(o, element),
            flat = opts.flat,
            showSelectionPalette = opts.showSelectionPalette,
            localStorageKey = opts.localStorageKey,
            theme = opts.theme,
            callbacks = opts.callbacks,
            resize = throttle(reflow, 10),
            visible = false,
            dragWidth = 0,
            dragHeight = 0,
            dragHelperHeight = 0,
            slideHeight = 0,
            slideWidth = 0,
            alphaWidth = 0,
            alphaSlideHelperWidth = 0,
            slideHelperHeight = 0,
            currentHue = 0,
            currentSaturation = 0,
            currentValue = 0,
            currentAlpha = 1,
            palette = opts.palette.slice(0),
            paletteArray = $.isArray(palette[0]) ? palette : [palette],
            selectionPalette = opts.selectionPalette.slice(0),
            maxSelectionSize = opts.maxSelectionSize,
            draggingClass = "sp-dragging",
            shiftMovementDirection = null;

        var doc = element.ownerDocument,
            body = doc.body,
            boundElement = $(element),
            disabled = false,
            container = $(markup, doc).addClass(theme),
            dragger = container.find(".sp-color"),
            dragHelper = container.find(".sp-dragger"),
            slider = container.find(".sp-hue"),
            slideHelper = container.find(".sp-slider"),
            alphaSliderInner = container.find(".sp-alpha-inner"),
            alphaSlider = container.find(".sp-alpha"),
            alphaSlideHelper = container.find(".sp-alpha-handle"),
            textInput = container.find(".sp-input"),
            paletteContainer = container.find(".sp-palette"),
            initialColorContainer = container.find(".sp-initial"),
            cancelButton = container.find(".sp-cancel"),
            clearButton = container.find(".sp-clear"),
            chooseButton = container.find(".sp-choose"),
            isInput = boundElement.is("input"),
            isInputTypeColor = isInput && inputTypeColorSupport && boundElement.attr("type") === "color",
            shouldReplace = isInput && !flat,
            replacer = (shouldReplace) ? $(replaceInput).addClass(theme).addClass(opts.className) : $([]),
            offsetElement = (shouldReplace) ? replacer : boundElement,
            previewElement = replacer.find(".sp-preview-inner"),
            initialColor = opts.color || (isInput && boundElement.val()),
            colorOnShow = false,
            preferredFormat = opts.preferredFormat,
            currentPreferredFormat = preferredFormat,
            clickoutFiresChange = !opts.showButtons || opts.clickoutFiresChange,
            isEmpty = !initialColor,
            allowEmpty = opts.allowEmpty && !isInputTypeColor;

        function applyOptions() {

            if (opts.showPaletteOnly) {
                opts.showPalette = true;
            }

            container.toggleClass("sp-flat", flat);
            container.toggleClass("sp-input-disabled", !opts.showInput);
            container.toggleClass("sp-alpha-enabled", opts.showAlpha);
            container.toggleClass("sp-clear-enabled", allowEmpty);
            container.toggleClass("sp-buttons-disabled", !opts.showButtons);
            container.toggleClass("sp-palette-disabled", !opts.showPalette);
            container.toggleClass("sp-palette-only", opts.showPaletteOnly);
            container.toggleClass("sp-initial-disabled", !opts.showInitial);
            container.addClass(opts.className);

            reflow();
        }

        function initialize() {

            if (IE) {
                container.find("*:not(input)").attr("unselectable", "on");
            }

            applyOptions();

            if (shouldReplace) {
                boundElement.after(replacer).hide();
            }

            if (!allowEmpty) {
                clearButton.hide();
            }

            if (flat) {
                boundElement.after(container).hide();
            }
            else {

                var appendTo = opts.appendTo === "parent" ? boundElement.parent() : $(opts.appendTo);
                if (appendTo.length !== 1) {
                    appendTo = $("body");
                }

                appendTo.append(container);
            }

            if (localStorageKey && window.localStorage) {

                // Migrate old palettes over to new format.  May want to remove this eventually.
                try {
                    var oldPalette = window.localStorage[localStorageKey].split(",#");
                    if (oldPalette.length > 1) {
                        delete window.localStorage[localStorageKey];
                        $.each(oldPalette, function(i, c) {
                             addColorToSelectionPalette(c);
                        });
                    }
                }
                catch(e) { }

                try {
                    selectionPalette = window.localStorage[localStorageKey].split(";");
                }
                catch (e) { }
            }

            offsetElement.bind("click.spectrum touchstart.spectrum", function (e) {
                if (!disabled) {
                    toggle();
                }

                e.stopPropagation();

                if (!$(e.target).is("input")) {
                    e.preventDefault();
                }
            });

            if(boundElement.is(":disabled") || (opts.disabled === true)) {
                disable();
            }

            // Prevent clicks from bubbling up to document.  This would cause it to be hidden.
            container.click(stopPropagation);

            // Handle user typed input
            textInput.change(setFromTextInput);
            textInput.bind("paste", function () {
                setTimeout(setFromTextInput, 1);
            });
            textInput.keydown(function (e) { if (e.keyCode == 13) { setFromTextInput(); } });

            cancelButton.text(opts.cancelText);
            cancelButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();
                hide("cancel");
            });


            clearButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

               isEmpty = true;

                move();
                if(flat) {
                    //for the flat style, this is a change event
                    updateOriginalInput(true);
                }
            });


            chooseButton.text(opts.chooseText);
            chooseButton.bind("click.spectrum", function (e) {
                e.stopPropagation();
                e.preventDefault();

                if (isValid()) {
                    updateOriginalInput(true);
                    hide();
                }
            });

            draggable(alphaSlider, function (dragX, dragY, e) {
                currentAlpha = (dragX / alphaWidth);
                isEmpty = false;
                if (e.shiftKey) {
                    currentAlpha = Math.round(currentAlpha * 10) / 10;
                }

                move();
            });

            draggable(slider, function (dragX, dragY) {
                currentHue = parseFloat(dragY / slideHeight);
                isEmpty = false;
                move();
            }, dragStart, dragStop);

            draggable(dragger, function (dragX, dragY, e) {

                // shift+drag should snap the movement to either the x or y axis.
                if (!e.shiftKey) {
                    shiftMovementDirection = null;
                }
                else if (!shiftMovementDirection) {
                    var oldDragX = currentSaturation * dragWidth;
                    var oldDragY = dragHeight - (currentValue * dragHeight);
                    var furtherFromX = Math.abs(dragX - oldDragX) > Math.abs(dragY - oldDragY);

                    shiftMovementDirection = furtherFromX ? "x" : "y";
                }

                var setSaturation = !shiftMovementDirection || shiftMovementDirection === "x";
                var setValue = !shiftMovementDirection || shiftMovementDirection === "y";

                if (setSaturation) {
                    currentSaturation = parseFloat(dragX / dragWidth);
                }
                if (setValue) {
                    currentValue = parseFloat((dragHeight - dragY) / dragHeight);
                }

                isEmpty = false;

                move();

            }, dragStart, dragStop);

            if (!!initialColor) {
                set(initialColor);

                // In case color was black - update the preview UI and set the format
                // since the set function will not run (default color is black).
                updateUI();
                currentPreferredFormat = preferredFormat || tinycolor(initialColor).format;

                addColorToSelectionPalette(initialColor);
            }
            else {
                updateUI();
            }

            if (flat) {
                show();
            }

            function palletElementClick(e) {
                if (e.data && e.data.ignore) {
                    set($(this).data("color"));
                    move();
                }
                else {
                    set($(this).data("color"));
                    updateOriginalInput(true);
                    move();
                    hide();
                }

                return false;
            }

            var paletteEvent = IE ? "mousedown.spectrum" : "click.spectrum touchstart.spectrum";
            paletteContainer.delegate(".sp-thumb-el", paletteEvent, palletElementClick);
            initialColorContainer.delegate(".sp-thumb-el:nth-child(1)", paletteEvent, { ignore: true }, palletElementClick);
        }

        function addColorToSelectionPalette(color) {
            if (showSelectionPalette) {
                var colorRgb = tinycolor(color).toRgbString();
                if ($.inArray(colorRgb, selectionPalette) === -1) {
                    selectionPalette.push(colorRgb);
                    while(selectionPalette.length > maxSelectionSize) {
                        selectionPalette.shift();
                    }
                }

                if (localStorageKey && window.localStorage) {
                    try {
                        window.localStorage[localStorageKey] = selectionPalette.join(";");
                    }
                    catch(e) { }
                }
            }
        }

        function getUniqueSelectionPalette() {
            var unique = [];
            var p = selectionPalette;
            var paletteLookup = {};
            var rgb;

            if (opts.showPalette) {

                for (var i = 0; i < paletteArray.length; i++) {
                    for (var j = 0; j < paletteArray[i].length; j++) {
                        rgb = tinycolor(paletteArray[i][j]).toRgbString();
                        paletteLookup[rgb] = true;
                    }
                }

                for (i = 0; i < p.length; i++) {
                    rgb = tinycolor(p[i]).toRgbString();

                    if (!paletteLookup.hasOwnProperty(rgb)) {
                        unique.push(p[i]);
                        paletteLookup[rgb] = true;
                    }
                }
            }

            return unique.reverse().slice(0, opts.maxSelectionSize);
        }

        function drawPalette() {

            var currentColor = get();

            var html = $.map(paletteArray, function (palette, i) {
                return paletteTemplate(palette, currentColor, "sp-palette-row sp-palette-row-" + i);
            });

            if (selectionPalette) {
                html.push(paletteTemplate(getUniqueSelectionPalette(), currentColor, "sp-palette-row sp-palette-row-selection"));
            }

            paletteContainer.html(html.join(""));
        }

        function drawInitial() {
            if (opts.showInitial) {
                var initial = colorOnShow;
                var current = get();
                initialColorContainer.html(paletteTemplate([initial, current], current, "sp-palette-row-initial"));
            }
        }

        function dragStart() {
            if (dragHeight <= 0 || dragWidth <= 0 || slideHeight <= 0) {
                reflow();
            }
            container.addClass(draggingClass);
            shiftMovementDirection = null;
        }

        function dragStop() {
            container.removeClass(draggingClass);
        }

        function setFromTextInput() {

            var value = textInput.val();

            if ((value === null || value === "") && allowEmpty) {
                set(null);
            }
            else {
                var tiny = tinycolor(value);
                if (tiny.ok) {
                    set(tiny);
                }
                else {
                    textInput.addClass("sp-validation-error");
                }
            }
        }

        function toggle() {
            if (visible) {
                hide();
            }
            else {
                show();
            }
        }

        function show() {
            var event = $.Event('beforeShow.spectrum');

            if (visible) {
                reflow();
                return;
            }

            boundElement.trigger(event, [ get() ]);

            if (callbacks.beforeShow(get()) === false || event.isDefaultPrevented()) {
                return;
            }

            hideAll();
            visible = true;

            $(doc).bind("click.spectrum", hide);
            $(window).bind("resize.spectrum", resize);
            replacer.addClass("sp-active");
            container.removeClass("sp-hidden");

            if (opts.showPalette) {
                drawPalette();
            }
            reflow();
            updateUI();

            colorOnShow = get();

            drawInitial();
            callbacks.show(colorOnShow);
            boundElement.trigger('show.spectrum', [ colorOnShow ]);
        }

        function hide(e) {

            // Return on right click
            if (e && e.type == "click" && e.button == 2) { return; }

            // Return if hiding is unnecessary
            if (!visible || flat) { return; }
            visible = false;

            $(doc).unbind("click.spectrum", hide);
            $(window).unbind("resize.spectrum", resize);

            replacer.removeClass("sp-active");
            container.addClass("sp-hidden");

            var colorHasChanged = !tinycolor.equals(get(), colorOnShow);

            if (colorHasChanged) {
                if (clickoutFiresChange && e !== "cancel") {
                    updateOriginalInput(true);
                }
                else {
                    revert();
                }
            }

            callbacks.hide(get());
            boundElement.trigger('hide.spectrum', [ get() ]);
        }

        function revert() {
            set(colorOnShow, true);
        }

        function set(color, ignoreFormatChange) {
            if (tinycolor.equals(color, get())) {
                return;
            }

            var newColor;
            if (!color && allowEmpty) {
                isEmpty = true;
            } else {
                isEmpty = false;
                newColor = tinycolor(color);
                var newHsv = newColor.toHsv();

                currentHue = (newHsv.h % 360) / 360;
                currentSaturation = newHsv.s;
                currentValue = newHsv.v;
                currentAlpha = newHsv.a;
            }
            updateUI();

            if (newColor && newColor.ok && !ignoreFormatChange) {
                currentPreferredFormat = preferredFormat || newColor.format;
            }
        }

        function get(opts) {
            opts = opts || { };

            if (allowEmpty && isEmpty) {
                return null;
            }

            return tinycolor.fromRatio({
                h: currentHue,
                s: currentSaturation,
                v: currentValue,
                a: Math.round(currentAlpha * 100) / 100
            }, { format: opts.format || currentPreferredFormat });
        }

        function isValid() {
            return !textInput.hasClass("sp-validation-error");
        }

        function move() {
            updateUI();

            callbacks.move(get());
            boundElement.trigger('move.spectrum', [ get() ]);
        }

        function updateUI() {

            textInput.removeClass("sp-validation-error");

            updateHelperLocations();

            // Update dragger background color (gradients take care of saturation and value).
            var flatColor = tinycolor.fromRatio({ h: currentHue, s: 1, v: 1 });
            dragger.css("background-color", flatColor.toHexString());

            // Get a format that alpha will be included in (hex and names ignore alpha)
            var format = currentPreferredFormat;
            if (currentAlpha < 1) {
                if (format === "hex" || format === "hex3" || format === "hex6" || format === "name") {
                    format = "rgb";
                }
            }

            var realColor = get({ format: format }),
                displayColor = '';

             //reset background info for preview element
            previewElement.removeClass("sp-clear-display");
            previewElement.css('background-color', 'transparent');

            if (!realColor && allowEmpty) {
                // Update the replaced elements background with icon indicating no color selection
                previewElement.addClass("sp-clear-display");
            }
            else {
               var realHex = realColor.toHexString(),
                    realRgb = realColor.toRgbString();

                // Update the replaced elements background color (with actual selected color)
                if (rgbaSupport || realColor.alpha === 1) {
                    previewElement.css("background-color", realRgb);
                }
                else {
                    previewElement.css("background-color", "transparent");
                    previewElement.css("filter", realColor.toFilter());
                }

                if (opts.showAlpha) {
                    var rgb = realColor.toRgb();
                    rgb.a = 0;
                    var realAlpha = tinycolor(rgb).toRgbString();
                    var gradient = "linear-gradient(left, " + realAlpha + ", " + realHex + ")";

                    if (IE) {
                        alphaSliderInner.css("filter", tinycolor(realAlpha).toFilter({ gradientType: 1 }, realHex));
                    }
                    else {
                        alphaSliderInner.css("background", "-webkit-" + gradient);
                        alphaSliderInner.css("background", "-moz-" + gradient);
                        alphaSliderInner.css("background", "-ms-" + gradient);
                        alphaSliderInner.css("background", gradient);
                    }
                }

                displayColor = realColor.toString(format);
            }
            // Update the text entry input as it changes happen
            if (opts.showInput) {
                textInput.val(displayColor);
            }

            if (opts.showPalette) {
                drawPalette();
            }

            drawInitial();
        }

        function updateHelperLocations() {
            var s = currentSaturation;
            var v = currentValue;

            if(allowEmpty && isEmpty) {
                //if selected color is empty, hide the helpers
                alphaSlideHelper.hide();
                slideHelper.hide();
                dragHelper.hide();
            }
            else {
                //make sure helpers are visible
                alphaSlideHelper.show();
                slideHelper.show();
                dragHelper.show();

                // Where to show the little circle in that displays your current selected color
                var dragX = s * dragWidth;
                var dragY = dragHeight - (v * dragHeight);
                dragX = Math.max(
                    -dragHelperHeight,
                    Math.min(dragWidth - dragHelperHeight, dragX - dragHelperHeight)
                );
                dragY = Math.max(
                    -dragHelperHeight,
                    Math.min(dragHeight - dragHelperHeight, dragY - dragHelperHeight)
                );
                dragHelper.css({
                    "top": dragY,
                    "left": dragX
                });

                var alphaX = currentAlpha * alphaWidth;
                alphaSlideHelper.css({
                    "left": alphaX - (alphaSlideHelperWidth / 2)
                });

                // Where to show the bar that displays your current selected hue
                var slideY = (currentHue) * slideHeight;
                slideHelper.css({
                    "top": slideY - slideHelperHeight
                });
            }
        }

        function updateOriginalInput(fireCallback) {
            var color = get(),
                displayColor = '',
                hasChanged = !tinycolor.equals(color, colorOnShow);

            if(color) {
                displayColor = color.toString(currentPreferredFormat);
                // Update the selection palette with the current color
                addColorToSelectionPalette(color);
            }

            if (isInput) {
                boundElement.val(displayColor);
            }

            colorOnShow = color;

            if (fireCallback && hasChanged) {
                callbacks.change(color);
                boundElement.trigger('change', [ color ]);
            }
        }

        function reflow() {
            dragWidth = dragger.width();
            dragHeight = dragger.height();
            dragHelperHeight = dragHelper.height();
            slideWidth = slider.width();
            slideHeight = slider.height();
            slideHelperHeight = slideHelper.height();
            alphaWidth = alphaSlider.width();
            alphaSlideHelperWidth = alphaSlideHelper.width();

            if (!flat) {
                container.css("position", "absolute");
                container.offset(getOffset(container, offsetElement));
            }

            updateHelperLocations();
        }

        function destroy() {
            boundElement.show();
            offsetElement.unbind("click.spectrum touchstart.spectrum");
            container.remove();
            replacer.remove();
            spectrums[spect.id] = null;
        }

        function option(optionName, optionValue) {
            if (optionName === undefined) {
                return $.extend({}, opts);
            }
            if (optionValue === undefined) {
                return opts[optionName];
            }

            opts[optionName] = optionValue;
            applyOptions();
        }

        function enable() {
            disabled = false;
            boundElement.attr("disabled", false);
            offsetElement.removeClass("sp-disabled");
        }

        function disable() {
            hide();
            disabled = true;
            boundElement.attr("disabled", true);
            offsetElement.addClass("sp-disabled");
        }

        initialize();

        var spect = {
            show: show,
            hide: hide,
            toggle: toggle,
            reflow: reflow,
            option: option,
            enable: enable,
            disable: disable,
            set: function (c) {
                set(c);
                updateOriginalInput();
            },
            get: get,
            destroy: destroy,
            container: container
        };

        spect.id = spectrums.push(spect) - 1;

        return spect;
    }

    /**
    * checkOffset - get the offset below/above and left/right element depending on screen position
    * Thanks https://github.com/jquery/jquery-ui/blob/master/ui/jquery.ui.datepicker.js
    */
    function getOffset(picker, input) {
        var extraY = 0;
        var dpWidth = picker.outerWidth();
        var dpHeight = picker.outerHeight();
        var inputHeight = input.outerHeight();
        var doc = picker[0].ownerDocument;
        var docElem = doc.documentElement;
        var viewWidth = docElem.clientWidth + $(doc).scrollLeft();
        var viewHeight = docElem.clientHeight + $(doc).scrollTop();
        var offset = input.offset();
        offset.top += inputHeight;

        offset.left -=
            Math.min(offset.left, (offset.left + dpWidth > viewWidth && viewWidth > dpWidth) ?
            Math.abs(offset.left + dpWidth - viewWidth) : 0);

        offset.top -=
            Math.min(offset.top, ((offset.top + dpHeight > viewHeight && viewHeight > dpHeight) ?
            Math.abs(dpHeight + inputHeight - extraY) : extraY));

        return offset;
    }

    /**
    * noop - do nothing
    */
    function noop() {

    }

    /**
    * stopPropagation - makes the code only doing this a little easier to read in line
    */
    function stopPropagation(e) {
        e.stopPropagation();
    }

    /**
    * Create a function bound to a given object
    * Thanks to underscore.js
    */
    function bind(func, obj) {
        var slice = Array.prototype.slice;
        var args = slice.call(arguments, 2);
        return function () {
            return func.apply(obj, args.concat(slice.call(arguments)));
        };
    }

    /**
    * Lightweight drag helper.  Handles containment within the element, so that
    * when dragging, the x is within [0,element.width] and y is within [0,element.height]
    */
    function draggable(element, onmove, onstart, onstop) {
        onmove = onmove || function () { };
        onstart = onstart || function () { };
        onstop = onstop || function () { };
        var doc = element.ownerDocument || document;
        var dragging = false;
        var offset = {};
        var maxHeight = 0;
        var maxWidth = 0;
        var hasTouch = ('ontouchstart' in window);

        var duringDragEvents = {};
        duringDragEvents["selectstart"] = prevent;
        duringDragEvents["dragstart"] = prevent;
        duringDragEvents["touchmove mousemove"] = move;
        duringDragEvents["touchend mouseup"] = stop;

        function prevent(e) {
            if (e.stopPropagation) {
                e.stopPropagation();
            }
            if (e.preventDefault) {
                e.preventDefault();
            }
            e.returnValue = false;
        }

        function move(e) {
            if (dragging) {
                // Mouseup happened outside of window
                if (IE && document.documentMode < 9 && !e.button) {
                    return stop();
                }

                var touches = e.originalEvent.touches;
                var pageX = touches ? touches[0].pageX : e.pageX;
                var pageY = touches ? touches[0].pageY : e.pageY;

                var dragX = Math.max(0, Math.min(pageX - offset.left, maxWidth));
                var dragY = Math.max(0, Math.min(pageY - offset.top, maxHeight));

                if (hasTouch) {
                    // Stop scrolling in iOS
                    prevent(e);
                }

                onmove.apply(element, [dragX, dragY, e]);
            }
        }
        function start(e) {
            var rightclick = (e.which) ? (e.which == 3) : (e.button == 2);
            var touches = e.originalEvent.touches;

            if (!rightclick && !dragging) {
                if (onstart.apply(element, arguments) !== false) {
                    dragging = true;
                    maxHeight = $(element).height();
                    maxWidth = $(element).width();
                    offset = $(element).offset();

                    $(doc).bind(duringDragEvents);
                    $(doc.body).addClass("sp-dragging");

                    if (!hasTouch) {
                        move(e);
                    }

                    prevent(e);
                }
            }
        }
        function stop() {
            if (dragging) {
                $(doc).unbind(duringDragEvents);
                $(doc.body).removeClass("sp-dragging");
                onstop.apply(element, arguments);
            }
            dragging = false;
        }

        $(element).bind("touchstart mousedown", start);
    }

    function throttle(func, wait, debounce) {
        var timeout;
        return function () {
            var context = this, args = arguments;
            var throttler = function () {
                timeout = null;
                func.apply(context, args);
            };
            if (debounce) clearTimeout(timeout);
            if (debounce || !timeout) timeout = setTimeout(throttler, wait);
        };
    }


    function log(){/* jshint -W021 */if(window.console){if(Function.prototype.bind)log=Function.prototype.bind.call(console.log,console);else log=function(){Function.prototype.apply.call(console.log,console,arguments);};log.apply(this,arguments);}}

    /**
    * Define a jQuery plugin
    */
    var dataID = "spectrum.id";
    $.fn.spectrum = function (opts, extra) {

        if (typeof opts == "string") {

            var returnValue = this;
            var args = Array.prototype.slice.call( arguments, 1 );

            this.each(function () {
                var spect = spectrums[$(this).data(dataID)];
                if (spect) {

                    var method = spect[opts];
                    if (!method) {
                        throw new Error( "Spectrum: no such method: '" + opts + "'" );
                    }

                    if (opts == "get") {
                        returnValue = spect.get();
                    }
                    else if (opts == "container") {
                        returnValue = spect.container;
                    }
                    else if (opts == "option") {
                        returnValue = spect.option.apply(spect, args);
                    }
                    else if (opts == "destroy") {
                        spect.destroy();
                        $(this).removeData(dataID);
                    }
                    else {
                        method.apply(spect, args);
                    }
                }
            });

            return returnValue;
        }

        // Initializing a new instance of spectrum
        return this.spectrum("destroy").each(function () {
            var spect = spectrum(this, opts);
            $(this).data(dataID, spect.id);
        });
    };

    $.fn.spectrum.load = true;
    $.fn.spectrum.loadOpts = {};
    $.fn.spectrum.draggable = draggable;
    $.fn.spectrum.defaults = defaultOpts;

    $.spectrum = { };
    $.spectrum.localization = { };
    $.spectrum.palettes = { };

    $.fn.spectrum.processNativeColorInputs = function () {
        if (!inputTypeColorSupport) {
            $("input[type=color]").spectrum({
                preferredFormat: "hex6"
            });
        }
    };

    // TinyColor v0.9.16
    // https://github.com/bgrins/TinyColor
    // 2013-08-10, Brian Grinstead, MIT License

    (function() {

    var trimLeft = /^[\s,#]+/,
        trimRight = /\s+$/,
        tinyCounter = 0,
        math = Math,
        mathRound = math.round,
        mathMin = math.min,
        mathMax = math.max,
        mathRandom = math.random;

    function tinycolor (color, opts) {

        color = (color) ? color : '';
        opts = opts || { };

        // If input is already a tinycolor, return itself
        if (typeof color == "object" && color.hasOwnProperty("_tc_id")) {
           return color;
        }

        var rgb = inputToRGB(color);
        var r = rgb.r,
            g = rgb.g,
            b = rgb.b,
            a = rgb.a,
            roundA = mathRound(100*a) / 100,
            format = opts.format || rgb.format;

        // Don't let the range of [0,255] come back in [0,1].
        // Potentially lose a little bit of precision here, but will fix issues where
        // .5 gets interpreted as half of the total, instead of half of 1
        // If it was supposed to be 128, this was already taken care of by `inputToRgb`
        if (r < 1) { r = mathRound(r); }
        if (g < 1) { g = mathRound(g); }
        if (b < 1) { b = mathRound(b); }

        return {
            ok: rgb.ok,
            format: format,
            _tc_id: tinyCounter++,
            alpha: a,
            getAlpha: function() {
                return a;
            },
            setAlpha: function(value) {
                a = boundAlpha(value);
                roundA = mathRound(100*a) / 100;
            },
            toHsv: function() {
                var hsv = rgbToHsv(r, g, b);
                return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: a };
            },
            toHsvString: function() {
                var hsv = rgbToHsv(r, g, b);
                var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
                return (a == 1) ?
                  "hsv("  + h + ", " + s + "%, " + v + "%)" :
                  "hsva(" + h + ", " + s + "%, " + v + "%, "+ roundA + ")";
            },
            toHsl: function() {
                var hsl = rgbToHsl(r, g, b);
                return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: a };
            },
            toHslString: function() {
                var hsl = rgbToHsl(r, g, b);
                var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
                return (a == 1) ?
                  "hsl("  + h + ", " + s + "%, " + l + "%)" :
                  "hsla(" + h + ", " + s + "%, " + l + "%, "+ roundA + ")";
            },
            toHex: function(allow3Char) {
                return rgbToHex(r, g, b, allow3Char);
            },
            toHexString: function(allow3Char) {
                return '#' + rgbToHex(r, g, b, allow3Char);
            },
            toRgb: function() {
                return { r: mathRound(r), g: mathRound(g), b: mathRound(b), a: a };
            },
            toRgbString: function() {
                return (a == 1) ?
                  "rgb("  + mathRound(r) + ", " + mathRound(g) + ", " + mathRound(b) + ")" :
                  "rgba(" + mathRound(r) + ", " + mathRound(g) + ", " + mathRound(b) + ", " + roundA + ")";
            },
            toPercentageRgb: function() {
                return { r: mathRound(bound01(r, 255) * 100) + "%", g: mathRound(bound01(g, 255) * 100) + "%", b: mathRound(bound01(b, 255) * 100) + "%", a: a };
            },
            toPercentageRgbString: function() {
                return (a == 1) ?
                  "rgb("  + mathRound(bound01(r, 255) * 100) + "%, " + mathRound(bound01(g, 255) * 100) + "%, " + mathRound(bound01(b, 255) * 100) + "%)" :
                  "rgba(" + mathRound(bound01(r, 255) * 100) + "%, " + mathRound(bound01(g, 255) * 100) + "%, " + mathRound(bound01(b, 255) * 100) + "%, " + roundA + ")";
            },
            toName: function() {
                if (a === 0) {
                    return "transparent";
                }

                return hexNames[rgbToHex(r, g, b, true)] || false;
            },
            toFilter: function(secondColor) {
                var hex = rgbToHex(r, g, b);
                var secondHex = hex;
                var alphaHex = Math.round(parseFloat(a) * 255).toString(16);
                var secondAlphaHex = alphaHex;
                var gradientType = opts && opts.gradientType ? "GradientType = 1, " : "";

                if (secondColor) {
                    var s = tinycolor(secondColor);
                    secondHex = s.toHex();
                    secondAlphaHex = Math.round(parseFloat(s.alpha) * 255).toString(16);
                }

                return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr=#" + pad2(alphaHex) + hex + ",endColorstr=#" + pad2(secondAlphaHex) + secondHex + ")";
            },
            toString: function(format) {
                var formatSet = !!format;
                format = format || this.format;

                var formattedString = false;
                var hasAlphaAndFormatNotSet = !formatSet && a < 1 && a > 0;
                var formatWithAlpha = hasAlphaAndFormatNotSet && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

                if (format === "rgb") {
                    formattedString = this.toRgbString();
                }
                if (format === "prgb") {
                    formattedString = this.toPercentageRgbString();
                }
                if (format === "hex" || format === "hex6") {
                    formattedString = this.toHexString();
                }
                if (format === "hex3") {
                    formattedString = this.toHexString(true);
                }
                if (format === "name") {
                    formattedString = this.toName();
                }
                if (format === "hsl") {
                    formattedString = this.toHslString();
                }
                if (format === "hsv") {
                    formattedString = this.toHsvString();
                }

                if (formatWithAlpha) {
                    return this.toRgbString();
                }

                return formattedString || this.toHexString();
            }
        };
    }

    // If input is an object, force 1 into "1.0" to handle ratios properly
    // String input requires "1.0" as input, so 1 will be treated as 1
    tinycolor.fromRatio = function(color, opts) {
        if (typeof color == "object") {
            var newColor = {};
            for (var i in color) {
                if (color.hasOwnProperty(i)) {
                    if (i === "a") {
                        newColor[i] = color[i];
                    }
                    else {
                        newColor[i] = convertToPercentage(color[i]);
                    }
                }
            }
            color = newColor;
        }

        return tinycolor(color, opts);
    };

    // Given a string or object, convert that input to RGB
    // Possible string inputs:
    //
    //     "red"
    //     "#f00" or "f00"
    //     "#ff0000" or "ff0000"
    //     "rgb 255 0 0" or "rgb (255, 0, 0)"
    //     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
    //     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
    //     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
    //     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
    //     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
    //     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
    //
    function inputToRGB(color) {

        var rgb = { r: 0, g: 0, b: 0 };
        var a = 1;
        var ok = false;
        var format = false;

        if (typeof color == "string") {
            color = stringInputToObject(color);
        }

        if (typeof color == "object") {
            if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
                rgb = rgbToRgb(color.r, color.g, color.b);
                ok = true;
                format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
                color.s = convertToPercentage(color.s);
                color.v = convertToPercentage(color.v);
                rgb = hsvToRgb(color.h, color.s, color.v);
                ok = true;
                format = "hsv";
            }
            else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
                color.s = convertToPercentage(color.s);
                color.l = convertToPercentage(color.l);
                rgb = hslToRgb(color.h, color.s, color.l);
                ok = true;
                format = "hsl";
            }

            if (color.hasOwnProperty("a")) {
                a = color.a;
            }
        }

        a = boundAlpha(a);

        return {
            ok: ok,
            format: color.format || format,
            r: mathMin(255, mathMax(rgb.r, 0)),
            g: mathMin(255, mathMax(rgb.g, 0)),
            b: mathMin(255, mathMax(rgb.b, 0)),
            a: a
        };
    }


    // Conversion Functions
    // --------------------

    // `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
    // <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

    // `rgbToRgb`
    // Handle bounds / percentage checking to conform to CSS color spec
    // <http://www.w3.org/TR/css3-color/>
    // *Assumes:* r, g, b in [0, 255] or [0, 1]
    // *Returns:* { r, g, b } in [0, 255]
    function rgbToRgb(r, g, b){
        return {
            r: bound01(r, 255) * 255,
            g: bound01(g, 255) * 255,
            b: bound01(b, 255) * 255
        };
    }

    // `rgbToHsl`
    // Converts an RGB color value to HSL.
    // *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
    // *Returns:* { h, s, l } in [0,1]
    function rgbToHsl(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, l = (max + min) / 2;

        if(max == min) {
            h = s = 0; // achromatic
        }
        else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }

            h /= 6;
        }

        return { h: h, s: s, l: l };
    }

    // `hslToRgb`
    // Converts an HSL color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
    function hslToRgb(h, s, l) {
        var r, g, b;

        h = bound01(h, 360);
        s = bound01(s, 100);
        l = bound01(l, 100);

        function hue2rgb(p, q, t) {
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        if(s === 0) {
            r = g = b = l; // achromatic
        }
        else {
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHsv`
    // Converts an RGB color value to HSV
    // *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
    // *Returns:* { h, s, v } in [0,1]
    function rgbToHsv(r, g, b) {

        r = bound01(r, 255);
        g = bound01(g, 255);
        b = bound01(b, 255);

        var max = mathMax(r, g, b), min = mathMin(r, g, b);
        var h, s, v = max;

        var d = max - min;
        s = max === 0 ? 0 : d / max;

        if(max == min) {
            h = 0; // achromatic
        }
        else {
            switch(max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: h, s: s, v: v };
    }

    // `hsvToRgb`
    // Converts an HSV color value to RGB.
    // *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
    // *Returns:* { r, g, b } in the set [0, 255]
     function hsvToRgb(h, s, v) {

        h = bound01(h, 360) * 6;
        s = bound01(s, 100);
        v = bound01(v, 100);

        var i = math.floor(h),
            f = h - i,
            p = v * (1 - s),
            q = v * (1 - f * s),
            t = v * (1 - (1 - f) * s),
            mod = i % 6,
            r = [v, q, p, p, t, v][mod],
            g = [t, v, v, q, p, p][mod],
            b = [p, p, t, v, v, q][mod];

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    // `rgbToHex`
    // Converts an RGB color to hex
    // Assumes r, g, and b are contained in the set [0, 255]
    // Returns a 3 or 6 character hex
    function rgbToHex(r, g, b, allow3Char) {

        var hex = [
            pad2(mathRound(r).toString(16)),
            pad2(mathRound(g).toString(16)),
            pad2(mathRound(b).toString(16))
        ];

        // Return a 3 character hex if possible
        if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
            return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
        }

        return hex.join("");
    }

    // `equals`
    // Can be called with any tinycolor input
    tinycolor.equals = function (color1, color2) {
        if (!color1 || !color2) { return false; }
        return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
    };
    tinycolor.random = function() {
        return tinycolor.fromRatio({
            r: mathRandom(),
            g: mathRandom(),
            b: mathRandom()
        });
    };


    // Modification Functions
    // ----------------------
    // Thanks to less.js for some of the basics here
    // <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

    tinycolor.desaturate = function (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s -= amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    };
    tinycolor.saturate = function (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.s += amount / 100;
        hsl.s = clamp01(hsl.s);
        return tinycolor(hsl);
    };
    tinycolor.greyscale = function(color) {
        return tinycolor.desaturate(color, 100);
    };
    tinycolor.lighten = function(color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l += amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    };
    tinycolor.darken = function (color, amount) {
        amount = (amount === 0) ? 0 : (amount || 10);
        var hsl = tinycolor(color).toHsl();
        hsl.l -= amount / 100;
        hsl.l = clamp01(hsl.l);
        return tinycolor(hsl);
    };
    tinycolor.complement = function(color) {
        var hsl = tinycolor(color).toHsl();
        hsl.h = (hsl.h + 180) % 360;
        return tinycolor(hsl);
    };


    // Combination Functions
    // ---------------------
    // Thanks to jQuery xColor for some of the ideas behind these
    // <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

    tinycolor.triad = function(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
        ];
    };
    tinycolor.tetrad = function(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
            tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
        ];
    };
    tinycolor.splitcomplement = function(color) {
        var hsl = tinycolor(color).toHsl();
        var h = hsl.h;
        return [
            tinycolor(color),
            tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
            tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
        ];
    };
    tinycolor.analogous = function(color, results, slices) {
        results = results || 6;
        slices = slices || 30;

        var hsl = tinycolor(color).toHsl();
        var part = 360 / slices;
        var ret = [tinycolor(color)];

        for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
            hsl.h = (hsl.h + part) % 360;
            ret.push(tinycolor(hsl));
        }
        return ret;
    };
    tinycolor.monochromatic = function(color, results) {
        results = results || 6;
        var hsv = tinycolor(color).toHsv();
        var h = hsv.h, s = hsv.s, v = hsv.v;
        var ret = [];
        var modification = 1 / results;

        while (results--) {
            ret.push(tinycolor({ h: h, s: s, v: v}));
            v = (v + modification) % 1;
        }

        return ret;
    };


    // Readability Functions
    // ---------------------
    // <http://www.w3.org/TR/AERT#color-contrast>

    // `readability`
    // Analyze the 2 colors and returns an object with the following properties:
    //    `brightness`: difference in brightness between the two colors
    //    `color`: difference in color/hue between the two colors
    tinycolor.readability = function(color1, color2) {
        var a = tinycolor(color1).toRgb();
        var b = tinycolor(color2).toRgb();
        var brightnessA = (a.r * 299 + a.g * 587 + a.b * 114) / 1000;
        var brightnessB = (b.r * 299 + b.g * 587 + b.b * 114) / 1000;
        var colorDiff = (
            Math.max(a.r, b.r) - Math.min(a.r, b.r) +
            Math.max(a.g, b.g) - Math.min(a.g, b.g) +
            Math.max(a.b, b.b) - Math.min(a.b, b.b)
        );

        return {
            brightness: Math.abs(brightnessA - brightnessB),
            color: colorDiff
        };
    };

    // `readable`
    // http://www.w3.org/TR/AERT#color-contrast
    // Ensure that foreground and background color combinations provide sufficient contrast.
    // *Example*
    //    tinycolor.readable("#000", "#111") => false
    tinycolor.readable = function(color1, color2) {
        var readability = tinycolor.readability(color1, color2);
        return readability.brightness > 125 && readability.color > 500;
    };

    // `mostReadable`
    // Given a base color and a list of possible foreground or background
    // colors for that base, returns the most readable color.
    // *Example*
    //    tinycolor.mostReadable("#123", ["#fff", "#000"]) => "#000"
    tinycolor.mostReadable = function(baseColor, colorList) {
        var bestColor = null;
        var bestScore = 0;
        var bestIsReadable = false;
        for (var i=0; i < colorList.length; i++) {

            // We normalize both around the "acceptable" breaking point,
            // but rank brightness constrast higher than hue.

            var readability = tinycolor.readability(baseColor, colorList[i]);
            var readable = readability.brightness > 125 && readability.color > 500;
            var score = 3 * (readability.brightness / 125) + (readability.color / 500);

            if ((readable && ! bestIsReadable) ||
                (readable && bestIsReadable && score > bestScore) ||
                ((! readable) && (! bestIsReadable) && score > bestScore)) {
                bestIsReadable = readable;
                bestScore = score;
                bestColor = tinycolor(colorList[i]);
            }
        }
        return bestColor;
    };


    // Big List of Colors
    // ------------------
    // <http://www.w3.org/TR/css3-color/#svg-color>
    var names = tinycolor.names = {
        aliceblue: "f0f8ff",
        antiquewhite: "faebd7",
        aqua: "0ff",
        aquamarine: "7fffd4",
        azure: "f0ffff",
        beige: "f5f5dc",
        bisque: "ffe4c4",
        black: "000",
        blanchedalmond: "ffebcd",
        blue: "00f",
        blueviolet: "8a2be2",
        brown: "a52a2a",
        burlywood: "deb887",
        burntsienna: "ea7e5d",
        cadetblue: "5f9ea0",
        chartreuse: "7fff00",
        chocolate: "d2691e",
        coral: "ff7f50",
        cornflowerblue: "6495ed",
        cornsilk: "fff8dc",
        crimson: "dc143c",
        cyan: "0ff",
        darkblue: "00008b",
        darkcyan: "008b8b",
        darkgoldenrod: "b8860b",
        darkgray: "a9a9a9",
        darkgreen: "006400",
        darkgrey: "a9a9a9",
        darkkhaki: "bdb76b",
        darkmagenta: "8b008b",
        darkolivegreen: "556b2f",
        darkorange: "ff8c00",
        darkorchid: "9932cc",
        darkred: "8b0000",
        darksalmon: "e9967a",
        darkseagreen: "8fbc8f",
        darkslateblue: "483d8b",
        darkslategray: "2f4f4f",
        darkslategrey: "2f4f4f",
        darkturquoise: "00ced1",
        darkviolet: "9400d3",
        deeppink: "ff1493",
        deepskyblue: "00bfff",
        dimgray: "696969",
        dimgrey: "696969",
        dodgerblue: "1e90ff",
        firebrick: "b22222",
        floralwhite: "fffaf0",
        forestgreen: "228b22",
        fuchsia: "f0f",
        gainsboro: "dcdcdc",
        ghostwhite: "f8f8ff",
        gold: "ffd700",
        goldenrod: "daa520",
        gray: "808080",
        green: "008000",
        greenyellow: "adff2f",
        grey: "808080",
        honeydew: "f0fff0",
        hotpink: "ff69b4",
        indianred: "cd5c5c",
        indigo: "4b0082",
        ivory: "fffff0",
        khaki: "f0e68c",
        lavender: "e6e6fa",
        lavenderblush: "fff0f5",
        lawngreen: "7cfc00",
        lemonchiffon: "fffacd",
        lightblue: "add8e6",
        lightcoral: "f08080",
        lightcyan: "e0ffff",
        lightgoldenrodyellow: "fafad2",
        lightgray: "d3d3d3",
        lightgreen: "90ee90",
        lightgrey: "d3d3d3",
        lightpink: "ffb6c1",
        lightsalmon: "ffa07a",
        lightseagreen: "20b2aa",
        lightskyblue: "87cefa",
        lightslategray: "789",
        lightslategrey: "789",
        lightsteelblue: "b0c4de",
        lightyellow: "ffffe0",
        lime: "0f0",
        limegreen: "32cd32",
        linen: "faf0e6",
        magenta: "f0f",
        maroon: "800000",
        mediumaquamarine: "66cdaa",
        mediumblue: "0000cd",
        mediumorchid: "ba55d3",
        mediumpurple: "9370db",
        mediumseagreen: "3cb371",
        mediumslateblue: "7b68ee",
        mediumspringgreen: "00fa9a",
        mediumturquoise: "48d1cc",
        mediumvioletred: "c71585",
        midnightblue: "191970",
        mintcream: "f5fffa",
        mistyrose: "ffe4e1",
        moccasin: "ffe4b5",
        navajowhite: "ffdead",
        navy: "000080",
        oldlace: "fdf5e6",
        olive: "808000",
        olivedrab: "6b8e23",
        orange: "ffa500",
        orangered: "ff4500",
        orchid: "da70d6",
        palegoldenrod: "eee8aa",
        palegreen: "98fb98",
        paleturquoise: "afeeee",
        palevioletred: "db7093",
        papayawhip: "ffefd5",
        peachpuff: "ffdab9",
        peru: "cd853f",
        pink: "ffc0cb",
        plum: "dda0dd",
        powderblue: "b0e0e6",
        purple: "800080",
        red: "f00",
        rosybrown: "bc8f8f",
        royalblue: "4169e1",
        saddlebrown: "8b4513",
        salmon: "fa8072",
        sandybrown: "f4a460",
        seagreen: "2e8b57",
        seashell: "fff5ee",
        sienna: "a0522d",
        silver: "c0c0c0",
        skyblue: "87ceeb",
        slateblue: "6a5acd",
        slategray: "708090",
        slategrey: "708090",
        snow: "fffafa",
        springgreen: "00ff7f",
        steelblue: "4682b4",
        tan: "d2b48c",
        teal: "008080",
        thistle: "d8bfd8",
        tomato: "ff6347",
        turquoise: "40e0d0",
        violet: "ee82ee",
        wheat: "f5deb3",
        white: "fff",
        whitesmoke: "f5f5f5",
        yellow: "ff0",
        yellowgreen: "9acd32"
    };

    // Make it easy to access colors via `hexNames[hex]`
    var hexNames = tinycolor.hexNames = flip(names);


    // Utilities
    // ---------

    // `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
    function flip(o) {
        var flipped = { };
        for (var i in o) {
            if (o.hasOwnProperty(i)) {
                flipped[o[i]] = i;
            }
        }
        return flipped;
    }

    // Return a valid alpha value [0,1] with all invalid values being set to 1
    function boundAlpha(a) {
        a = parseFloat(a);

        if (isNaN(a) || a < 0 || a > 1) {
            a = 1;
        }

        return a;
    }

    // Take input from [0, n] and return it as [0, 1]
    function bound01(n, max) {
        if (isOnePointZero(n)) { n = "100%"; }

        var processPercent = isPercentage(n);
        n = mathMin(max, mathMax(0, parseFloat(n)));

        // Automatically convert percentage into number
        if (processPercent) {
            n = parseInt(n * max, 10) / 100;
        }

        // Handle floating point rounding errors
        if ((math.abs(n - max) < 0.000001)) {
            return 1;
        }

        // Convert into [0, 1] range if it isn't already
        return (n % max) / parseFloat(max);
    }

    // Force a number between 0 and 1
    function clamp01(val) {
        return mathMin(1, mathMax(0, val));
    }

    // Parse an integer into hex
    function parseHex(val) {
        return parseInt(val, 16);
    }

    // Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
    // <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
    function isOnePointZero(n) {
        return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
    }

    // Check to see if string passed in is a percentage
    function isPercentage(n) {
        return typeof n === "string" && n.indexOf('%') != -1;
    }

    // Force a hex value to have 2 characters
    function pad2(c) {
        return c.length == 1 ? '0' + c : '' + c;
    }

    // Replace a decimal with it's percentage value
    function convertToPercentage(n) {
        if (n <= 1) {
            n = (n * 100) + "%";
        }

        return n;
    }

    var matchers = (function() {

        // <http://www.w3.org/TR/css3-values/#integers>
        var CSS_INTEGER = "[-\\+]?\\d+%?";

        // <http://www.w3.org/TR/css3-values/#number-value>
        var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

        // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
        var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

        // Actual matching.
        // Parentheses and commas are optional, but not required.
        // Whitespace can take the place of commas or opening paren
        var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
        var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

        return {
            rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
            rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
            hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
            hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
            hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
            hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
            hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
        };
    })();

    // `stringInputToObject`
    // Permissive string parsing.  Take in a number of formats, and output an object
    // based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
    function stringInputToObject(color) {

        color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
        var named = false;
        if (names[color]) {
            color = names[color];
            named = true;
        }
        else if (color == 'transparent') {
            return { r: 0, g: 0, b: 0, a: 0, format: "name" };
        }

        // Try to match string input using regular expressions.
        // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
        // Just return an object and let the conversion functions handle that.
        // This way the result will be the same whether the tinycolor is initialized with string or object.
        var match;
        if ((match = matchers.rgb.exec(color))) {
            return { r: match[1], g: match[2], b: match[3] };
        }
        if ((match = matchers.rgba.exec(color))) {
            return { r: match[1], g: match[2], b: match[3], a: match[4] };
        }
        if ((match = matchers.hsl.exec(color))) {
            return { h: match[1], s: match[2], l: match[3] };
        }
        if ((match = matchers.hsla.exec(color))) {
            return { h: match[1], s: match[2], l: match[3], a: match[4] };
        }
        if ((match = matchers.hsv.exec(color))) {
            return { h: match[1], s: match[2], v: match[3] };
        }
        if ((match = matchers.hex6.exec(color))) {
            return {
                r: parseHex(match[1]),
                g: parseHex(match[2]),
                b: parseHex(match[3]),
                format: named ? "name" : "hex"
            };
        }
        if ((match = matchers.hex3.exec(color))) {
            return {
                r: parseHex(match[1] + '' + match[1]),
                g: parseHex(match[2] + '' + match[2]),
                b: parseHex(match[3] + '' + match[3]),
                format: named ? "name" : "hex"
            };
        }

        return false;
    }

    // Expose tinycolor to window, does not need to run in non-browser context.
    window.tinycolor = tinycolor;

    })();


    $(function () {
        if ($.fn.spectrum.load) {
            $.fn.spectrum.processNativeColorInputs();
        }
    });

})(window, jQuery);

  try { console.log('done loading leaflet.draw JS'); } catch(e) {}

  window.plugin.drawTools.boot();

  $('head').append('<style>/* ================================================================== */\n/* Toolbars\n/* ================================================================== */\n\n.leaflet-draw-section {\n	position: relative;\n}\n\n.leaflet-draw-toolbar {\n	margin-top: 12px;\n}\n\n.leaflet-draw-toolbar-top {\n	margin-top: 0;\n}\n\n.leaflet-draw-toolbar-notop a:first-child {\n	border-top-right-radius: 0;\n}\n\n.leaflet-draw-toolbar-nobottom a:last-child {\n	border-bottom-right-radius: 0;\n}\n\n.leaflet-draw-toolbar a {\n	background-image: url(\'images/spritesheet.png\');\n	background-image: linear-gradient(transparent, transparent), url(\'images/spritesheet.svg\');\n	background-repeat: no-repeat;\n	background-size: 270px 30px;\n}\n\n.leaflet-retina .leaflet-draw-toolbar a {\n	background-image: url(\'images/spritesheet-2x.png\');\n	background-image: linear-gradient(transparent, transparent), url(\'images/spritesheet.svg\');\n}\n\n.leaflet-draw a {\n	display: block;\n	text-align: center;\n	text-decoration: none;\n}\n\n/* ================================================================== */\n/* Toolbar actions menu\n/* ================================================================== */\n\n.leaflet-draw-actions {\n	display: none;\n	list-style: none;\n	margin: 0;\n	padding: 0;\n	position: absolute;\n	left: 26px; /* leaflet-draw-toolbar.left + leaflet-draw-toolbar.width */\n	top: 0;\n	white-space: nowrap;\n}\n\n.leaflet-touch .leaflet-draw-actions {\n	left: 32px;\n}\n\n.leaflet-right .leaflet-draw-actions {\n	right:26px;\n	left:auto;\n}\n\n.leaflet-touch .leaflet-right .leaflet-draw-actions {\n	right:32px;\n	left:auto;\n}\n\n.leaflet-draw-actions li {\n	display: inline-block;\n}\n\n.leaflet-draw-actions li:first-child a {\n	border-left: none;\n}\n\n.leaflet-draw-actions li:last-child a {\n	-webkit-border-radius: 0 4px 4px 0;\n	        border-radius: 0 4px 4px 0;\n}\n\n.leaflet-right .leaflet-draw-actions li:last-child a {\n	-webkit-border-radius: 0;\n	        border-radius: 0;\n}\n\n.leaflet-right .leaflet-draw-actions li:first-child a {\n	-webkit-border-radius: 4px 0 0 4px;\n	        border-radius: 4px 0 0 4px;\n}\n\n.leaflet-draw-actions a {\n	background-color: #919187;\n	border-left: 1px solid #AAA;\n	color: #FFF;\n	font: 11px/19px "Helvetica Neue", Arial, Helvetica, sans-serif;\n	line-height: 28px;\n	text-decoration: none;\n	padding-left: 10px;\n	padding-right: 10px;\n	height: 28px;\n}\n\n.leaflet-touch .leaflet-draw-actions a {\n	font-size: 12px;\n	line-height: 30px;\n	height: 30px;\n}\n\n.leaflet-draw-actions-bottom {\n	margin-top: 0;\n}\n\n.leaflet-draw-actions-top {\n	margin-top: 1px;\n}\n\n.leaflet-draw-actions-top a,\n.leaflet-draw-actions-bottom a {\n	height: 27px;\n	line-height: 27px;\n}\n\n.leaflet-draw-actions a:hover {\n	background-color: #A0A098;\n}\n\n.leaflet-draw-actions-top.leaflet-draw-actions-bottom a {\n	height: 26px;\n	line-height: 26px;\n}\n\n/* ================================================================== */\n/* Draw toolbar\n/* ================================================================== */\n\n.leaflet-draw-toolbar .leaflet-draw-draw-polyline {\n	background-position: -2px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-draw-polyline {\n	background-position: 0 -1px;\n}\n\n.leaflet-draw-toolbar .leaflet-draw-draw-polygon {\n	background-position: -31px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-draw-polygon {\n	background-position: -29px -1px;\n}\n\n.leaflet-draw-toolbar .leaflet-draw-draw-rectangle {\n	background-position: -62px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-draw-rectangle {\n	background-position: -60px -1px;\n}\n\n.leaflet-draw-toolbar .leaflet-draw-draw-circle {\n	background-position: -92px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-draw-circle {\n	background-position: -90px -1px;\n}\n\n.leaflet-draw-toolbar .leaflet-draw-draw-marker {\n	background-position: -122px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-draw-marker {\n	background-position: -120px -1px;\n}\n\n/* ================================================================== */\n/* Edit toolbar\n/* ================================================================== */\n\n.leaflet-draw-toolbar .leaflet-draw-edit-edit {\n	background-position: -152px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-edit-edit {\n	background-position: -150px -1px;\n}\n\n.leaflet-draw-toolbar .leaflet-draw-edit-remove {\n	background-position: -182px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-edit-remove {\n	background-position: -180px -1px;\n}\n\n.leaflet-draw-toolbar .leaflet-draw-edit-edit.leaflet-disabled {\n	background-position: -212px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-edit-edit.leaflet-disabled {\n	background-position: -210px -1px;\n}\n\n.leaflet-draw-toolbar .leaflet-draw-edit-remove.leaflet-disabled {\n	background-position: -242px -2px;\n}\n\n.leaflet-touch .leaflet-draw-toolbar .leaflet-draw-edit-remove.leaflet-disabled {\n	background-position: -240px -2px;\n}\n\n/* ================================================================== */\n/* Drawing styles\n/* ================================================================== */\n\n.leaflet-mouse-marker {\n	background-color: #fff;\n	cursor: crosshair;\n}\n\n.leaflet-draw-tooltip {\n	background: rgb(54, 54, 54);\n	background: rgba(0, 0, 0, 0.5);\n	border: 1px solid transparent;\n	-webkit-border-radius: 4px;\n	        border-radius: 4px;\n	color: #fff;\n	font: 12px/18px "Helvetica Neue", Arial, Helvetica, sans-serif;\n	margin-left: 20px;\n	margin-top: -21px;\n	padding: 4px 8px;\n	position: absolute;\n	visibility: hidden;\n	white-space: nowrap;\n	z-index: 6;\n}\n\n.leaflet-draw-tooltip:before {\n	border-right: 6px solid black;\n	border-right-color: rgba(0, 0, 0, 0.5);\n	border-top: 6px solid transparent;\n	border-bottom: 6px solid transparent;\n	content: "";\n	position: absolute;\n	top: 7px;\n	left: -7px;\n}\n\n.leaflet-error-draw-tooltip {\n	background-color: #F2DEDE;\n	border: 1px solid #E6B6BD;\n	color: #B94A48;\n}\n\n.leaflet-error-draw-tooltip:before {\n	border-right-color: #E6B6BD;\n}\n\n.leaflet-draw-tooltip-single {\n	margin-top: -12px\n}\n\n.leaflet-draw-tooltip-subtext {\n	color: #f8d5e4;\n}\n\n.leaflet-draw-guide-dash {\n	font-size: 1%;\n	opacity: 0.6;\n	position: absolute;\n	width: 5px;\n	height: 5px;\n}\n\n/* ================================================================== */\n/* Edit styles\n/* ================================================================== */\n\n.leaflet-edit-marker-selected {\n	background: rgba(254, 87, 161, 0.1);\n	border: 4px dashed rgba(254, 87, 161, 0.6);\n	-webkit-border-radius: 4px;\n	        border-radius: 4px;\n	box-sizing: content-box;\n}\n\n.leaflet-edit-move {\n	cursor: move;\n}\n\n.leaflet-edit-resize {\n	cursor: pointer;\n}\n\n/* ================================================================== */\n/* Old IE styles\n/* ================================================================== */\n\n.leaflet-oldie .leaflet-draw-toolbar {\n	border: 1px solid #999;\n}</style>');
  $('head').append('<style>/***\nSpectrum Colorpicker v1.2.0\nhttps://github.com/bgrins/spectrum\nAuthor: Brian Grinstead\nLicense: MIT\n***/\n\n.sp-container {\n    position:absolute;\n    top:0;\n    left:0;\n    display:inline-block;\n    *display: inline;\n    *zoom: 1;\n    /* https://github.com/bgrins/spectrum/issues/40 */\n    z-index: 9999994;\n    overflow: hidden;\n}\n.sp-container.sp-flat {\n    position: relative;\n}\n\n/* http://ansciath.tumblr.com/post/7347495869/css-aspect-ratio */\n.sp-top {\n  position:relative;\n  width: 100%;\n  display:inline-block;\n}\n.sp-top-inner {\n   position:absolute;\n   top:0;\n   left:0;\n   bottom:0;\n   right:0;\n}\n.sp-color {\n    position: absolute;\n    top:0;\n    left:0;\n    bottom:0;\n    right:20%;\n}\n.sp-hue {\n    position: absolute;\n    top:0;\n    right:0;\n    bottom:0;\n    left:84%;\n    height: 100%;\n}\n\n.sp-clear-enabled .sp-hue {\n    top:33px;\n    height: 77.5%;\n}\n\n.sp-fill {\n    padding-top: 80%;\n}\n.sp-sat, .sp-val {\n    position: absolute;\n    top:0;\n    left:0;\n    right:0;\n    bottom:0;\n}\n\n.sp-alpha-enabled .sp-top {\n    margin-bottom: 18px;\n}\n.sp-alpha-enabled .sp-alpha {\n    display: block;\n}\n.sp-alpha-handle {\n    position:absolute;\n    top:-4px;\n    bottom: -4px;\n    width: 6px;\n    left: 50%;\n    cursor: pointer;\n    border: 1px solid black;\n    background: white;\n    opacity: .8;\n}\n.sp-alpha {\n    display: none;\n    position: absolute;\n    bottom: -14px;\n    right: 0;\n    left: 0;\n    height: 8px;\n}\n.sp-alpha-inner {\n    border: solid 1px #333;\n}\n\n.sp-clear {\n    display: none;\n}\n\n.sp-clear.sp-clear-display {\n    background-position: center;\n}\n\n.sp-clear-enabled .sp-clear {\n    display: block;\n    position:absolute;\n    top:0px;\n    right:0;\n    bottom:0;\n    left:84%;\n    height: 28px;\n}\n\n/* Don\'t allow text selection */\n.sp-container, .sp-replacer, .sp-preview, .sp-dragger, .sp-slider, .sp-alpha, .sp-clear, .sp-alpha-handle, .sp-container.sp-dragging .sp-input, .sp-container button  {\n    -webkit-user-select:none;\n    -moz-user-select: -moz-none;\n    -o-user-select:none;\n    user-select: none;\n}\n\n.sp-container.sp-input-disabled .sp-input-container {\n    display: none;\n}\n.sp-container.sp-buttons-disabled .sp-button-container {\n    display: none;\n}\n.sp-palette-only .sp-picker-container {\n    display: none;\n}\n.sp-palette-disabled .sp-palette-container {\n    display: none;\n}\n\n.sp-initial-disabled .sp-initial {\n    display: none;\n}\n\n\n/* Gradients for hue, saturation and value instead of images.  Not pretty... but it works */\n.sp-sat {\n    background-image: -webkit-gradient(linear,  0 0, 100% 0, from(#FFF), to(rgba(204, 154, 129, 0)));\n    background-image: -webkit-linear-gradient(left, #FFF, rgba(204, 154, 129, 0));\n    background-image: -moz-linear-gradient(left, #fff, rgba(204, 154, 129, 0));\n    background-image: -o-linear-gradient(left, #fff, rgba(204, 154, 129, 0));\n    background-image: -ms-linear-gradient(left, #fff, rgba(204, 154, 129, 0));\n    background-image: linear-gradient(to right, #fff, rgba(204, 154, 129, 0));\n    -ms-filter: "progid:DXImageTransform.Microsoft.gradient(GradientType = 1, startColorstr=#FFFFFFFF, endColorstr=#00CC9A81)";\n    filter : progid:DXImageTransform.Microsoft.gradient(GradientType = 1, startColorstr=\'#FFFFFFFF\', endColorstr=\'#00CC9A81\');\n}\n.sp-val {\n    background-image: -webkit-gradient(linear, 0 100%, 0 0, from(#000000), to(rgba(204, 154, 129, 0)));\n    background-image: -webkit-linear-gradient(bottom, #000000, rgba(204, 154, 129, 0));\n    background-image: -moz-linear-gradient(bottom, #000, rgba(204, 154, 129, 0));\n    background-image: -o-linear-gradient(bottom, #000, rgba(204, 154, 129, 0));\n    background-image: -ms-linear-gradient(bottom, #000, rgba(204, 154, 129, 0));\n    background-image: linear-gradient(to top, #000, rgba(204, 154, 129, 0));\n    -ms-filter: "progid:DXImageTransform.Microsoft.gradient(startColorstr=#00CC9A81, endColorstr=#FF000000)";\n    filter : progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#00CC9A81\', endColorstr=\'#FF000000\');\n}\n\n.sp-hue {\n    background: -moz-linear-gradient(top, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);\n    background: -ms-linear-gradient(top, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);\n    background: -o-linear-gradient(top, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);\n    background: -webkit-gradient(linear, left top, left bottom, from(#ff0000), color-stop(0.17, #ffff00), color-stop(0.33, #00ff00), color-stop(0.5, #00ffff), color-stop(0.67, #0000ff), color-stop(0.83, #ff00ff), to(#ff0000));\n    background: -webkit-linear-gradient(top, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);\n}\n\n/* IE filters do not support multiple color stops.\n   Generate 6 divs, line them up, and do two color gradients for each.\n   Yes, really.\n */\n.sp-1 {\n    height:17%;\n    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#ff0000\', endColorstr=\'#ffff00\');\n}\n.sp-2 {\n    height:16%;\n    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#ffff00\', endColorstr=\'#00ff00\');\n}\n.sp-3 {\n    height:17%;\n    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#00ff00\', endColorstr=\'#00ffff\');\n}\n.sp-4 {\n    height:17%;\n    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#00ffff\', endColorstr=\'#0000ff\');\n}\n.sp-5 {\n    height:16%;\n    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#0000ff\', endColorstr=\'#ff00ff\');\n}\n.sp-6 {\n    height:17%;\n    filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=\'#ff00ff\', endColorstr=\'#ff0000\');\n}\n\n.sp-hidden {\n    display: none !important;\n}\n\n/* Clearfix hack */\n.sp-cf:before, .sp-cf:after { content: ""; display: table; }\n.sp-cf:after { clear: both; }\n.sp-cf { *zoom: 1; }\n\n/* Mobile devices, make hue slider bigger so it is easier to slide */\n@media (max-device-width: 480px) {\n    .sp-color { right: 40%; }\n    .sp-hue { left: 63%; }\n    .sp-fill { padding-top: 60%; }\n}\n.sp-dragger {\n   border-radius: 5px;\n   height: 5px;\n   width: 5px;\n   border: 1px solid #fff;\n   background: #000;\n   cursor: pointer;\n   position:absolute;\n   top:0;\n   left: 0;\n}\n.sp-slider {\n    position: absolute;\n    top:0;\n    cursor:pointer;\n    height: 3px;\n    left: -1px;\n    right: -1px;\n    border: 1px solid #000;\n    background: white;\n    opacity: .8;\n}\n\n/*\nTheme authors:\nHere are the basic themeable display options (colors, fonts, global widths).\nSee http://bgrins.github.io/spectrum/themes/ for instructions.\n*/\n\n.sp-container {\n    border-radius: 0;\n    background-color: #ECECEC;\n    border: solid 1px #f0c49B;\n    padding: 0;\n}\n.sp-container, .sp-container button, .sp-container input, .sp-color, .sp-hue, .sp-clear\n{\n    font: normal 12px "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Geneva, Verdana, sans-serif;\n    -webkit-box-sizing: border-box;\n    -moz-box-sizing: border-box;\n    -ms-box-sizing: border-box;\n    box-sizing: border-box;\n}\n.sp-top\n{\n    margin-bottom: 3px;\n}\n.sp-color, .sp-hue, .sp-clear\n{\n    border: solid 1px #666;\n}\n\n/* Input */\n.sp-input-container {\n    float:right;\n    width: 100px;\n    margin-bottom: 4px;\n}\n.sp-initial-disabled  .sp-input-container {\n    width: 100%;\n}\n.sp-input {\n   font-size: 12px !important;\n   border: 1px inset;\n   padding: 4px 5px;\n   margin: 0;\n   width: 100%;\n   background:transparent;\n   border-radius: 3px;\n   color: #222;\n}\n.sp-input:focus  {\n    border: 1px solid orange;\n}\n.sp-input.sp-validation-error\n{\n    border: 1px solid red;\n    background: #fdd;\n}\n.sp-picker-container , .sp-palette-container\n{\n    float:left;\n    position: relative;\n    padding: 10px;\n    padding-bottom: 300px;\n    margin-bottom: -290px;\n}\n.sp-picker-container\n{\n    width: 172px;\n    border-left: solid 1px #fff;\n}\n\n/* Palettes */\n.sp-palette-container\n{\n    border-right: solid 1px #ccc;\n}\n\n.sp-palette .sp-thumb-el {\n    display: block;\n    position:relative;\n    float:left;\n    width: 24px;\n    height: 15px;\n    margin: 3px;\n    cursor: pointer;\n    border:solid 2px transparent;\n}\n.sp-palette .sp-thumb-el:hover, .sp-palette .sp-thumb-el.sp-thumb-active {\n    border-color: orange;\n}\n.sp-thumb-el\n{\n    position:relative;\n}\n\n/* Initial */\n.sp-initial\n{\n    float: left;\n    border: solid 1px #333;\n}\n.sp-initial span {\n    width: 30px;\n    height: 25px;\n    border:none;\n    display:block;\n    float:left;\n    margin:0;\n}\n\n.sp-initial .sp-clear-display {\n    background-position: center;\n}\n\n/* Buttons */\n.sp-button-container {\n    float: right;\n}\n\n/* Replacer (the little preview div that shows up instead of the <input>) */\n.sp-replacer {\n    margin:0;\n    overflow:hidden;\n    cursor:pointer;\n    padding: 4px;\n    display:inline-block;\n    *zoom: 1;\n    *display: inline;\n    border: solid 1px #91765d;\n    background: #eee;\n    color: #333;\n    vertical-align: middle;\n}\n.sp-replacer:hover, .sp-replacer.sp-active {\n    border-color: #F0C49B;\n    color: #111;\n}\n.sp-replacer.sp-disabled {\n    cursor:default;\n    border-color: silver;\n    color: silver;\n}\n.sp-dd {\n    padding: 2px 0;\n    height: 16px;\n    line-height: 16px;\n    float:left;\n    font-size:10px;\n}\n.sp-preview\n{\n    position:relative;\n    width:25px;\n    height: 20px;\n    border: solid 1px #222;\n    margin-right: 5px;\n    float:left;\n    z-index: 0;\n}\n\n.sp-palette\n{\n    *width: 220px;\n    max-width: 220px;\n}\n.sp-palette .sp-thumb-el\n{\n    width:16px;\n    height: 16px;\n    margin:2px 1px;\n    border: solid 1px #d0d0d0;\n}\n\n.sp-container\n{\n    padding-bottom:0;\n}\n\n\n/* Buttons: http://hellohappy.org/css3-buttons/ */\n.sp-container button {\n  background-color: #eeeeee;\n  background-image: -webkit-linear-gradient(top, #eeeeee, #cccccc);\n  background-image: -moz-linear-gradient(top, #eeeeee, #cccccc);\n  background-image: -ms-linear-gradient(top, #eeeeee, #cccccc);\n  background-image: -o-linear-gradient(top, #eeeeee, #cccccc);\n  background-image: linear-gradient(to bottom, #eeeeee, #cccccc);\n  border: 1px solid #ccc;\n  border-bottom: 1px solid #bbb;\n  border-radius: 3px;\n  color: #333;\n  font-size: 14px;\n  line-height: 1;\n  padding: 5px 4px;\n  text-align: center;\n  text-shadow: 0 1px 0 #eee;\n  vertical-align: middle;\n}\n.sp-container button:hover {\n    background-color: #dddddd;\n    background-image: -webkit-linear-gradient(top, #dddddd, #bbbbbb);\n    background-image: -moz-linear-gradient(top, #dddddd, #bbbbbb);\n    background-image: -ms-linear-gradient(top, #dddddd, #bbbbbb);\n    background-image: -o-linear-gradient(top, #dddddd, #bbbbbb);\n    background-image: linear-gradient(to bottom, #dddddd, #bbbbbb);\n    border: 1px solid #bbb;\n    border-bottom: 1px solid #999;\n    cursor: pointer;\n    text-shadow: 0 1px 0 #ddd;\n}\n.sp-container button:active {\n    border: 1px solid #aaa;\n    border-bottom: 1px solid #888;\n    -webkit-box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee;\n    -moz-box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee;\n    -ms-box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee;\n    -o-box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee;\n    box-shadow: inset 0 0 5px 2px #aaaaaa, 0 1px 0 0 #eeeeee;\n}\n.sp-cancel\n{\n    font-size: 11px;\n    color: #d93f3f !important;\n    margin:0;\n    padding:2px;\n    margin-right: 5px;\n    vertical-align: middle;\n    text-decoration:none;\n\n}\n.sp-cancel:hover\n{\n    color: #d93f3f !important;\n    text-decoration: underline;\n}\n\n\n.sp-palette span:hover, .sp-palette span.sp-thumb-active\n{\n    border-color: #000;\n}\n\n.sp-preview, .sp-alpha, .sp-thumb-el\n{\n    position:relative;\n    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADZF8uwAAAAGUlEQVQYV2M4gwH+YwCGIasIUwhT25BVBADtzYNYrHvv4gAAAABJRU5ErkJggg==);\n}\n.sp-preview-inner, .sp-alpha-inner, .sp-thumb-inner\n{\n    display:block;\n    position:absolute;\n    top:0;left:0;bottom:0;right:0;\n}\n\n.sp-palette .sp-thumb-inner\n{\n    background-position: 50% 50%;\n    background-repeat: no-repeat;\n}\n\n.sp-palette .sp-thumb-light.sp-thumb-active .sp-thumb-inner\n{\n    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAIVJREFUeNpiYBhsgJFMffxAXABlN5JruT4Q3wfi/0DsT64h8UD8HmpIPCWG/KemIfOJCUB+Aoacx6EGBZyHBqI+WsDCwuQ9mhxeg2A210Ntfo8klk9sOMijaURm7yc1UP2RNCMbKE9ODK1HM6iegYLkfx8pligC9lCD7KmRof0ZhjQACDAAceovrtpVBRkAAAAASUVORK5CYII=);\n}\n\n.sp-palette .sp-thumb-dark.sp-thumb-active .sp-thumb-inner\n{\n    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAadEVYdFNvZnR3YXJlAFBhaW50Lk5FVCB2My41LjEwMPRyoQAAAMdJREFUOE+tkgsNwzAMRMugEAahEAahEAZhEAqlEAZhEAohEAYh81X2dIm8fKpEspLGvudPOsUYpxE2BIJCroJmEW9qJ+MKaBFhEMNabSy9oIcIPwrB+afvAUFoK4H0tMaQ3XtlrggDhOVVMuT4E5MMG0FBbCEYzjYT7OxLEvIHQLY2zWwQ3D+9luyOQTfKDiFD3iUIfPk8VqrKjgAiSfGFPecrg6HN6m/iBcwiDAo7WiBeawa+Kwh7tZoSCGLMqwlSAzVDhoK+6vH4G0P5wdkAAAAASUVORK5CYII=);\n}\n\n.sp-clear-display {\n    background-repeat:no-repeat;\n    background-position: center;\n    background-image: url(data:image/gif;base64,R0lGODlhFAAUAPcAAAAAAJmZmZ2dnZ6enqKioqOjo6SkpKWlpaampqenp6ioqKmpqaqqqqurq/Hx8fLy8vT09PX19ff39/j4+Pn5+fr6+vv7+wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAP8ALAAAAAAUABQAAAihAP9FoPCvoMGDBy08+EdhQAIJCCMybCDAAYUEARBAlFiQQoMABQhKUJBxY0SPICEYHBnggEmDKAuoPMjS5cGYMxHW3IiT478JJA8M/CjTZ0GgLRekNGpwAsYABHIypcAgQMsITDtWJYBR6NSqMico9cqR6tKfY7GeBCuVwlipDNmefAtTrkSzB1RaIAoXodsABiZAEFB06gIBWC1mLVgBa0AAOw==);\n}\n</style>');
}

window.plugin.drawTools.getMarkerIcon = function(color) {
  if (typeof(color) === 'undefined') {
    console.warn('Color is not set or not a valid color. Using default color as fallback.');
    color = '#a24ac3';
  }

  var svgIcon = window.plugin.drawTools.markerTemplate.replace(/%COLOR%/g, color);

  return L.divIcon({
    iconSize: new L.Point(25, 41),
    iconAnchor: new L.Point(12, 41),
    html: svgIcon,
    className: 'leaflet-iitc-custom-icon',
    // L.divIcon does not use the option color, but we store it here to
    // be able to simply retrieve the color for serializing markers
    color: color
  });
}

window.plugin.drawTools.currentColor = '#a24ac3';
window.plugin.drawTools.markerTemplate = '<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg"\n	version="1.1" baseProfile="full"\n	width="25px" height="41px" viewBox="0 0 25 41">\n\n	<path d="M1.36241844765,18.67488124675 A12.5,12.5 0 1,1 23.63758155235,18.67488124675 L12.5,40.5336158073 Z" style="stroke:none; fill: %COLOR%;" />\n	<path d="M1.80792170975,18.44788599685 A12,12 0 1,1 23.19207829025,18.44788599685 L12.5,39.432271175 Z" style="stroke:#000000; stroke-width:1px; stroke-opacity: 0.15; fill: none;" />\n	<path d="M2.921679865,17.8803978722 A10.75,10.75 0 1,1 22.078320135,17.8803978722 L12.5,36.6789095943 Z" style="stroke:#ffffff; stroke-width:1.5px; stroke-opacity: 0.35; fill: none;" />\n\n	<path d="M19.86121593215,17.25 L12.5,21.5 L5.13878406785,17.25 L5.13878406785,8.75 L12.5,4.5 L19.86121593215,8.75 Z M7.7368602792,10.25 L17.2631397208,10.25 L12.5,18.5 Z M12.5,13 L7.7368602792,10.25 M12.5,13 L17.2631397208,10.25 M12.5,13 L12.5,18.5 M19.86121593215,17.25 L16.39711431705,15.25 M5.13878406785,17.25 L8.60288568295,15.25 M12.5,4.5 L12.5,8.5" style="stroke:#ffffff; stroke-width:1.25px; stroke-opacity: 1; fill: none;" />\n\n</svg>';

window.plugin.drawTools.setOptions = function() {

  window.plugin.drawTools.lineOptions = {
    stroke: true,
    color: window.plugin.drawTools.currentColor,
    weight: 4,
    opacity: 0.5,
    fill: false,
    clickable: true
  };

  window.plugin.drawTools.polygonOptions = L.extend({}, window.plugin.drawTools.lineOptions, {
    fill: true,
    fillColor: null, // to use the same as 'color' for fill
    fillOpacity: 0.2
  });

  window.plugin.drawTools.editOptions = L.extend({}, window.plugin.drawTools.polygonOptions, {
    dashArray: [10,10]
  });
  delete window.plugin.drawTools.editOptions.color;

  window.plugin.drawTools.markerOptions = {
    icon: window.plugin.drawTools.currentMarker,
    zIndexOffset: 2000
  };

}

window.plugin.drawTools.setDrawColor = function(color) {
  window.plugin.drawTools.currentColor = color;
  window.plugin.drawTools.currentMarker = window.plugin.drawTools.getMarkerIcon(color);
  
  window.plugin.drawTools.lineOptions.color = color;
  window.plugin.drawTools.polygonOptions.color = color;
  window.plugin.drawTools.markerOptions.icon = window.plugin.drawTools.currentMarker;
  
  plugin.drawTools.drawControl.setDrawingOptions({
    polygon:  { shapeOptions: plugin.drawTools.polygonOptions },
    polyline: { shapeOptions: plugin.drawTools.lineOptions },
    circle:   { shapeOptions: plugin.drawTools.polygonOptions },
    marker:   { icon:         plugin.drawTools.markerOptions.icon },
  });
}

// renders the draw control buttons in the top left corner
window.plugin.drawTools.addDrawControl = function() {
  var drawControl = new L.Control.Draw({
    draw: {
      rectangle: false,
      polygon: {
        title: 'Add a polygon\n\n'
          + 'Click on the button, then click on the map to\n'
          + 'define the start of the polygon. Continue clicking\n'
          + 'to draw the line you want. Click the first or last\n'
          + 'point of the line (a small white rectangle) to\n'
          + 'finish. Double clicking also works.',
        shapeOptions: window.plugin.drawTools.polygonOptions,
        snapPoint: window.plugin.drawTools.getSnapLatLng,
      },

      polyline: {
        title: 'Add a (poly) line.\n\n'
          + 'Click on the button, then click on the map to\n'
          + 'define the start of the line. Continue clicking\n'
          + 'to draw the line you want. Click the <b>last</b>\n'
          + 'point of the line (a small white rectangle) to\n'
          + 'finish. Double clicking also works.',
        shapeOptions: window.plugin.drawTools.lineOptions,
        snapPoint: window.plugin.drawTools.getSnapLatLng,
      },

      circle: {
        title: 'Add a circle.\n\n'
          + 'Click on the button, then click-AND-HOLD on the\n'
          + 'map where the circle’s center should be. Move\n'
          + 'the mouse to control the radius. Release the mouse\n'
          + 'to finish.',
        shapeOptions: window.plugin.drawTools.polygonOptions,
        snapPoint: window.plugin.drawTools.getSnapLatLng,
      },

      // Options for marker (icon, zIndexOffset) are not set via shapeOptions,
      // so we have merge them here!
      marker: L.extend({}, window.plugin.drawTools.markerOptions, {
        title: 'Add a marker.\n\n'
          + 'Click on the button, then click on the map where\n'
          + 'you want the marker to appear.',
        snapPoint: window.plugin.drawTools.getSnapLatLng,
        repeatMode: true
      }),

    },

    edit: {
      featureGroup: window.plugin.drawTools.drawnItems,

      edit: {
        title: 'Edit drawn items',
        selectedPathOptions: window.plugin.drawTools.editOptions,
      },

      remove: {
        title: 'Delete drawn items'
      },

    },

  });

  window.plugin.drawTools.drawControl = drawControl;

  map.addControl(drawControl);
  //plugin.drawTools.addCustomButtons();

  window.plugin.drawTools.setAccessKeys();
  for (var toolbarId in drawControl._toolbars) {
    if (drawControl._toolbars[toolbarId] instanceof L.Toolbar) {
      drawControl._toolbars[toolbarId].on('enable', function() {
        setTimeout(window.plugin.drawTools.setAccessKeys, 10);
      });
    }
  }
}

window.plugin.drawTools.setAccessKeys = function() {
  var expr = /\s*\[\w+\]$/;
  // there is no API to add accesskeys, so have to dig in the DOM
  // must be same order as in markup. Note that each toolbar has a container for save/cancel
  var accessKeys = [
    'l', 'p', 'o', 'm', // line, polygon, circle, marker
    'a',                // cancel (_abort)
    'e', 'd',           // edit, delete
    's', 'a',           // save, cancel
  ];
  var buttons = window.plugin.drawTools.drawControl._container.getElementsByTagName('a');
  for(var i=0;i<buttons.length;i++) {
    var button = buttons[i];

    var title = button.title;
    var index = title.search(expr);
    if(index !== -1) title = title.substr(0, index);

    if(!button.offsetParent) { // element hidden, delete accessKey (so other elements can use it)
      button.accessKey = '';
    } else if(accessKeys[i]) {
      button.accessKey = accessKeys[i];
      if(title === "") title = "[" + accessKeys[i] + "]";
      else title += " [" + accessKeys[i] + "]";
    }
    button.title = title;
  }
}


// given a point it tries to find the most suitable portal to
// snap to. It takes the CircleMarker’s radius and weight into account.
// Will return null if nothing to snap to or a LatLng instance.
window.plugin.drawTools.getSnapLatLng = function(unsnappedLatLng) {
  var containerPoint = map.latLngToContainerPoint(unsnappedLatLng);
  var candidates = [];
  $.each(window.portals, function(guid, portal) {
    var ll = portal.getLatLng();
    var pp = map.latLngToContainerPoint(ll);
    var size = portal.options.weight + portal.options.radius;
    var dist = pp.distanceTo(containerPoint);
    if(dist > size) return true;
    candidates.push([dist, ll]);
  });

  if(candidates.length === 0) return unsnappedLatLng;
  candidates = candidates.sort(function(a, b) { return a[0]-b[0]; });
  return new L.LatLng(candidates[0][1].lat, candidates[0][1].lng);  //return a clone of the portal location
}


window.plugin.drawTools.save = function() {
  var data = [];

  window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
    var item = {};
    if (layer instanceof L.GeodesicCircle || layer instanceof L.Circle) {
      item.type = 'circle';
      item.latLng = layer.getLatLng();
      item.radius = layer.getRadius();
      item.color = layer.options.color;
    } else if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
      item.type = 'polygon';
      item.latLngs = layer.getLatLngs();
      item.color = layer.options.color;
    } else if (layer instanceof L.GeodesicPolyline || layer instanceof L.Polyline) {
      item.type = 'polyline';
      item.latLngs = layer.getLatLngs();
      item.color = layer.options.color;
    } else if (layer instanceof L.Marker) {
      item.type = 'marker';
      item.latLng = layer.getLatLng();
      item.color = layer.options.icon.options.color;
    } else {
      console.warn('Unknown layer type when saving draw tools layer');
      return; //.eachLayer 'continue'
    }

    data.push(item);
  });

  localStorage['plugin-draw-tools-layer'] = JSON.stringify(data);

  console.log('draw-tools: saved to localStorage');
}

window.plugin.drawTools.load = function() {
  try {
    var dataStr = localStorage['plugin-draw-tools-layer'];
    if (dataStr === undefined) return;

    var data = JSON.parse(dataStr);
    window.plugin.drawTools.import(data);

  } catch(e) {
    console.warn('draw-tools: failed to load data from localStorage: '+e);
  }
}

window.plugin.drawTools.import = function(data) {
  $.each(data, function(index,item) {
    var layer = null;
    var extraOpt = {};
    if (item.color) extraOpt.color = item.color;

    switch(item.type) {
      case 'polyline':
        layer = L.geodesicPolyline(item.latLngs, L.extend({},window.plugin.drawTools.lineOptions,extraOpt));
        break;
      case 'polygon':
        layer = L.geodesicPolygon(item.latLngs, L.extend({},window.plugin.drawTools.polygonOptions,extraOpt));
        break;
      case 'circle':
        layer = L.geodesicCircle(item.latLng, item.radius, L.extend({},window.plugin.drawTools.polygonOptions,extraOpt));
        break;
      case 'marker':
        var extraMarkerOpt = {};
        if (item.color) extraMarkerOpt.icon = window.plugin.drawTools.getMarkerIcon(item.color);
        layer = L.marker(item.latLng, L.extend({},window.plugin.drawTools.markerOptions,extraMarkerOpt));
        window.registerMarkerForOMS(layer);
        break;
      default:
        console.warn('unknown layer type "'+item.type+'" when loading draw tools layer');
        break;
    }
    if (layer) {
      window.plugin.drawTools.drawnItems.addLayer(layer);
    }
  });

  runHooks('pluginDrawTools', {event: 'import'});

}


//Draw Tools Options

// Manual import, export and reset data
window.plugin.drawTools.manualOpt = function() {

  var html = '<div class="drawtoolsStyles">'
           + '<input type="color" name="drawColor" id="drawtools_color"></input>'
//TODO: add line style choosers: thickness, maybe dash styles?
           + '</div>'
           + '<div class="drawtoolsSetbox">'
           + '<a onclick="window.plugin.drawTools.optCopy();" tabindex="0">Copy Drawn Items</a>'
           + '<a onclick="window.plugin.drawTools.optPaste();return false;" tabindex="0">Paste Drawn Items</a>'
           + (window.requestFile != undefined
             ? '<a onclick="window.plugin.drawTools.optImport();return false;" tabindex="0">Import Drawn Items</a>' : '')
           + ((typeof android !== 'undefined' && android && android.saveFile)
             ? '<a onclick="window.plugin.drawTools.optExport();return false;" tabindex="0">Export Drawn Items</a>' : '')
           + '<a onclick="window.plugin.drawTools.optReset();return false;" tabindex="0">Reset Drawn Items</a>'
           + '<a onclick="window.plugin.drawTools.snapToPortals();return false;" tabindex="0">Snap to portals</a>'
           + '</div>';

  dialog({
    html: html,
    id: 'plugin-drawtools-options',
    dialogClass: 'ui-dialog-drawtoolsSet',
    title: 'Draw Tools Options'
  });

  // need to initialise the 'spectrum' colour picker
  $('#drawtools_color').spectrum({
    flat: false,
    showInput: false,
    showButtons: false,
    showPalette: true,
    showSelectionPalette: false,
    palette: [ ['#a24ac3','#514ac3','#4aa8c3','#51c34a'],
               ['#c1c34a','#c38a4a','#c34a4a','#c34a6f'],
               ['#000000','#666666','#bbbbbb','#ffffff']
    ],
    change: function(color) { window.plugin.drawTools.setDrawColor(color.toHexString()); },
//    move: function(color) { window.plugin.drawTools.setDrawColor(color.toHexString()); },
    color: window.plugin.drawTools.currentColor,
  });
}

window.plugin.drawTools.optAlert = function(message) {
    $('.ui-dialog-drawtoolsSet .ui-dialog-buttonset').prepend('<p class="drawtools-alert" style="float:left;margin-top:4px;">'+message+'</p>');
    $('.drawtools-alert').delay(2500).fadeOut();
}

window.plugin.drawTools.optCopy = function() {
    if (typeof android !== 'undefined' && android && android.shareString) {
        android.shareString(localStorage['plugin-draw-tools-layer']);
    } else {
      var stockWarnings = {};
      var stockLinks = [];
      window.plugin.drawTools.drawnItems.eachLayer( function(layer) {
        if (layer instanceof L.GeodesicCircle || layer instanceof L.Circle) {
          stockWarnings.noCircle = true;
          return; //.eachLayer 'continue'
        } else if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
          stockWarnings.polyAsLine = true;
          // but we can export them
        } else if (layer instanceof L.GeodesicPolyline || layer instanceof L.Polyline) {
          // polylines are fine
        } else if (layer instanceof L.Marker) {
          stockWarnings.noMarker = true;
          return; //.eachLayer 'continue'
        } else {
          stockWarnings.unknown = true; //should never happen
          return; //.eachLayer 'continue'
        }
        // only polygons and polylines make it through to here
        var latLngs = layer.getLatLngs();
        // stock only handles one line segment at a time
        for (var i=0; i<latLngs.length-1; i++) {
          stockLinks.push([latLngs[i].lat,latLngs[i].lng,latLngs[i+1].lat,latLngs[i+1].lng]);
        }
        // for polygons, we also need a final link from last to first point
        if (layer instanceof L.GeodesicPolygon || layer instanceof L.Polygon) {
          stockLinks.push([latLngs[latLngs.length-1].lat,latLngs[latLngs.length-1].lng,latLngs[0].lat,latLngs[0].lng]);
        }
      });
      var stockUrl = 'https://www.ingress.com/intel?ll='+map.getCenter().lat+','+map.getCenter().lng+'&z='+map.getZoom()+'&pls='+stockLinks.map(function(link){return link.join(',');}).join('_');
      var stockWarnTexts = [];
      if (stockWarnings.polyAsLine) stockWarnTexts.push('Note: polygons are exported as lines');
      if (stockLinks.length>40) stockWarnTexts.push('Warning: Stock intel may not work with more than 40 line segments - there are '+stockLinks.length);
      if (stockWarnings.noCircle) stockWarnTexts.push('Warning: Circles cannot be exported to stock intel');
      if (stockWarnings.noMarker) stockWarnTexts.push('Warning: Markers cannot be exported to stock intel');
      if (stockWarnings.unknown) stockWarnTexts.push('Warning: UNKNOWN ITEM TYPE');

      var html = '<p><a onclick="$(\'.ui-dialog-drawtoolsSet-copy textarea\').select();">Select all</a> and press CTRL+C to copy it.</p>'
                +'<textarea readonly onclick="$(\'.ui-dialog-drawtoolsSet-copy textarea\').select();">'+localStorage['plugin-draw-tools-layer']+'</textarea>'
                +'<p>or, export as a link for the standard intel map (for non IITC users)</p>'
                +'<input onclick="event.target.select();" type="text" size="90" value="'+stockUrl+'"/>';
      if (stockWarnTexts.length>0) {
        html += '<ul><li>'+stockWarnTexts.join('</li><li>')+'</li></ul>';
      }

      dialog({
        html: html,
        width: 600,
        dialogClass: 'ui-dialog-drawtoolsSet-copy',
        title: 'Draw Tools Export'
        });
    }
}

window.plugin.drawTools.optExport = function() {
  if(typeof android !== 'undefined' && android && android.saveFile) {
    android.saveFile('IITC-drawn-items.json', 'application/json', localStorage['plugin-draw-tools-layer']);
  }
}

window.plugin.drawTools.optPaste = function() {
  var promptAction = prompt('Press CTRL+V to paste (draw-tools data or stock intel URL).', '');
  if(promptAction !== null && promptAction !== '') {
    try {
      // first see if it looks like a URL-format stock intel link, and if so, try and parse out any stock drawn items
      // from the pls parameter
      if (promptAction.match(new RegExp("^(https?://)?(www\\.)ingress\\.com/intel.*[?&]pls="))) {
        //looks like a ingress URL that has drawn items...
        var items = promptAction.split(/[?&]/);
        var foundAt = -1;
        for (var i=0; i<items.length; i++) {
          if (items[i].substr(0,4) == "pls=") {
            foundAt = i;
          }
        }

        if (foundAt == -1) throw ("No drawn items found in intel URL");

        var newLines = [];
        var linesStr = items[foundAt].substr(4).split('_');
        for (var i=0; i<linesStr.length; i++) {
          var floats = linesStr[i].split(',').map(Number);
          if (floats.length != 4) throw("URL item not a set of four floats");
          for (var j=0; j<floats.length; j++) {
            if (isNaN(floats[j])) throw("URL item had invalid number");
          }
          var layer = L.geodesicPolyline([[floats[0],floats[1]],[floats[2],floats[3]]], window.plugin.drawTools.lineOptions);
          newLines.push(layer);
        }

        // all parsed OK - clear and insert
        window.plugin.drawTools.drawnItems.clearLayers();
        for (var i=0; i<newLines.length; i++) {
          window.plugin.drawTools.drawnItems.addLayer(newLines[i]);
        }
        runHooks('pluginDrawTools', {event: 'import'});

        console.log('DRAWTOOLS: reset and imported drawn items from stock URL');
        window.plugin.drawTools.optAlert('Import Successful.');


      } else {
        var data = JSON.parse(promptAction);
        window.plugin.drawTools.drawnItems.clearLayers();
        window.plugin.drawTools.import(data);
        console.log('DRAWTOOLS: reset and imported drawn items');
        window.plugin.drawTools.optAlert('Import Successful.');
      }

      // to write back the data to localStorage
      window.plugin.drawTools.save();
    } catch(e) {
      console.warn('DRAWTOOLS: failed to import data: '+e);
      window.plugin.drawTools.optAlert('<span style="color: #f88">Import failed</span>');
    }
  }
}

window.plugin.drawTools.optImport = function() {
  if (window.requestFile === undefined) return;
  window.requestFile(function(filename, content) {
    try {
      var data = JSON.parse(content);
      window.plugin.drawTools.drawnItems.clearLayers();
      window.plugin.drawTools.import(data);
      console.log('DRAWTOOLS: reset and imported drawn tiems');
      window.plugin.drawTools.optAlert('Import Successful.');

      // to write back the data to localStorage
      window.plugin.drawTools.save();
    } catch(e) {
      console.warn('DRAWTOOLS: failed to import data: '+e);
      window.plugin.drawTools.optAlert('<span style="color: #f88">Import failed</span>');
    }
  });
}

window.plugin.drawTools.optReset = function() {
  var promptAction = confirm('All drawn items will be deleted. Are you sure?', '');
  if(promptAction) {
    delete localStorage['plugin-draw-tools-layer'];
    window.plugin.drawTools.drawnItems.clearLayers();
    window.plugin.drawTools.load();
    console.log('DRAWTOOLS: reset all drawn items');
    window.plugin.drawTools.optAlert('Reset Successful. ');
    runHooks('pluginDrawTools', {event: 'clear'});
  }
}

window.plugin.drawTools.snapToPortals = function() {
  var dataParams = getMapZoomTileParameters(getDataZoomForMapZoom(map.getZoom()));
  if (dataParams.level > 0) {
    if (!confirm('Not all portals are visible on the map. Snap to portals may move valid points to the wrong place. Continue?')) {
      return;
    }
  }

  if (mapDataRequest.status.short != 'done') {
    if (!confirm('Map data has not completely loaded, so some portals may be missing. Do you want to continue?')) {
      return;
    }
  }

  var visibleBounds = map.getBounds();

  // let's do all the distance calculations in screen space. 2d is much easier, should be faster, and is more than good enough
  // we'll pre-project all the on-screen portals too, to save repeatedly doing it
  var visiblePortals = {};
  $.each(window.portals, function(guid,portal) {
    var ll = portal.getLatLng();
    if (visibleBounds.contains(ll)) {
      visiblePortals[guid] = map.project(ll);
    }
  });

  if (Object.keys(visiblePortals).length == 0) {
    alert('Error: No portals visible in this view - nothing to snap points to!');
    return;
  }

  var findClosestPortalLatLng = function(latlng) {
    var testpoint = map.project(latlng);

    var minDistSquared = undefined;
    var minGuid = undefined;
    for (var guid in visiblePortals) {
      var p = visiblePortals[guid];
      var distSquared = (testpoint.x-p.x)*(testpoint.x-p.x) + (testpoint.y-p.y)*(testpoint.y-p.y);
      if (minDistSquared == undefined || minDistSquared > distSquared) {
        minDistSquared = distSquared;
        minGuid = guid;
      }
    }
    return minGuid ? portals[minGuid].getLatLng() : undefined; //should never hit 'undefined' case - as we abort when the list is empty
  };


  var changedCount = 0;
  var testCount = 0;

  window.plugin.drawTools.drawnItems.eachLayer(function(layer) {
    if (layer.getLatLng) {
      //circles and markers - a single point to snap
      var ll = layer.getLatLng();
      if (visibleBounds.contains(ll)) {
        testCount++;
        var newll = findClosestPortalLatLng(ll);
        if (!newll.equals(ll)) {
          layer.setLatLng(new L.LatLng(newll.lat,newll.lng));
          changedCount++;
        }
      }
    } else if (layer.getLatLngs) {
      var lls = layer.getLatLngs();
      var layerChanged = false;
      for (var i=0; i<lls.length; i++) {
        if (visibleBounds.contains(lls[i])) {
          testCount++;
          var newll = findClosestPortalLatLng(lls[i]);
          if (!newll.equals(lls[i])) {
            lls[i] = new L.LatLng(newll.lat,newll.lng);
            changedCount++;
            layerChanged = true;
          }
        }
      }
      if (layerChanged) {
        layer.setLatLngs(lls);
      }
    }
  });

  if(changedCount > 0) {
    runHooks('pluginDrawTools',{event:'layersSnappedToPortals'}); //or should we send 'layersEdited'? as that's effectively what's happened...
  }

  alert('Tested '+testCount+' points, and moved '+changedCount+' onto portal coordinates');

  window.plugin.drawTools.save();
}

window.plugin.drawTools.boot = function() {
  // add a custom hook for draw tools to share it's activity with other plugins
  pluginCreateHook('pluginDrawTools');

  window.plugin.drawTools.currentMarker = window.plugin.drawTools.getMarkerIcon(window.plugin.drawTools.currentColor);

  window.plugin.drawTools.setOptions();

  //create a leaflet FeatureGroup to hold drawn items
  window.plugin.drawTools.drawnItems = new L.FeatureGroup();

  //load any previously saved items
  plugin.drawTools.load();

  //add the draw control - this references the above FeatureGroup for editing purposes
  plugin.drawTools.addDrawControl();

  //start off hidden. if the layer is enabled, the below addLayerGroup will add it, triggering a 'show'
  $('.leaflet-draw-section').hide();


  //hide the draw tools when the 'drawn items' layer is off, show it when on
  map.on('layeradd', function(obj) {
    if(obj.layer === window.plugin.drawTools.drawnItems) {
      $('.leaflet-draw-section').show();
    }
  });
  map.on('layerremove', function(obj) {
    if(obj.layer === window.plugin.drawTools.drawnItems) {
      $('.leaflet-draw-section').hide();
    }
  });

  //add the layer
  window.addLayerGroup('Drawn Items', window.plugin.drawTools.drawnItems, true);


  //place created items into the specific layer
  map.on('draw:created', function(e) {
    var type=e.layerType;
    var layer=e.layer;
    window.plugin.drawTools.drawnItems.addLayer(layer);
    window.plugin.drawTools.save();

    if(layer instanceof L.Marker) {
      window.registerMarkerForOMS(layer);
    }

    runHooks('pluginDrawTools',{event:'layerCreated',layer:layer});
  });

  map.on('draw:deleted', function(e) {
    window.plugin.drawTools.save();
    runHooks('pluginDrawTools',{event:'layersDeleted'});
  });

  map.on('draw:edited', function(e) {
    window.plugin.drawTools.save();
    runHooks('pluginDrawTools',{event:'layersEdited'});
  });
  //add options menu
  $('#toolbox').append('<a onclick="window.plugin.drawTools.manualOpt();return false;" accesskey="x" title="[x]">DrawTools Opt</a>');

  $('head').append('<style>' +
        '.drawtoolsSetbox > a { display:block; color:#ffce00; border:1px solid #ffce00; padding:3px 0; margin:10px auto; width:80%; text-align:center; background:rgba(8,48,78,.9); }'+
        '.ui-dialog-drawtoolsSet-copy textarea { width:96%; height:250px; resize:vertical; }'+
        '</style>');

}


var setup =  window.plugin.drawTools.loadExternals;

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);


