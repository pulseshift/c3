import CLASS from './class'
import { ChartInternal } from './core'
import { isValue } from './util'

ChartInternal.prototype.initRegion = function() {
  var $$ = this
  $$.region = $$.main
    .append('g')
    .attr('clip-path', $$.clipPath)
    .attr('class', CLASS.regions)
}
ChartInternal.prototype.updateRegion = function(duration) {
  var $$ = this,
    config = $$.config

  // hide if arc type
  $$.region.style('visibility', $$.hasArcType() ? 'hidden' : 'visible')

  // === START PULSESHIFT CUSTOM EXTENSION ===
  var mainRegion = $$.main
    .select('.' + CLASS.regions)
    .selectAll('.' + CLASS.region)
    .data(config.regions)
  var g = mainRegion.enter().append('g')
  g.append('rect')
    .attr('class', CLASS.regionArea)
    .attr('x', $$.regionX.bind($$))
    .attr('y', $$.regionY.bind($$))
    .attr('width', $$.regionWidth.bind($$))
    .attr('height', $$.regionHeight.bind($$))
    .style('fill-opacity', function(d) {
      return isValue(d.opacity) ? d.opacity : 0.1
    })
  g.append('rect')
    .attr('class', CLASS.regionStripe)
    .style('fill-opacity', 0)
  g.append('text')
    .attr('class', CLASS.regionText)
    .attr('dy', '0.5rem')
    .attr('text-anchor', 'end')
    .text(function(d) {
      return d.text ? d.text : ''
    })
    .style('fill-opacity', 0)
  // === END PULSESHIFT CUSTOM EXTENSION ===
  g.append('text').text($$.labelRegion.bind($$))
  $$.mainRegion = g.merge(mainRegion).attr('class', $$.classRegion.bind($$))
  mainRegion
    .exit()
    .transition()
    .duration(duration)
    .style('opacity', 0)
    .remove()
}
ChartInternal.prototype.redrawRegion = function(withTransition, transition) {
  var $$ = this,
    regions = $$.mainRegion
      .selectAll('rect.' + CLASS.regionArea)
      .each(function() {
        var parentData = $$.d3.select(this.parentNode).datum()
        $$.d3.select(this).datum(parentData)
      }),
    regionLabels = $$.mainRegion.selectAll(
      'text:not(' + CLASS.regionText + ')'
    ),
    regionStripes = $$.mainRegion
      .selectAll('rect.' + CLASS.regionStripe)
      .each(function() {
        var parentData = $$.d3.select(this.parentNode).datum()
        $$.d3.select(this).datum(parentData)
      }),
    regionTexts = $$.mainRegion
      .selectAll('text.' + CLASS.regionText)
      .each(function() {
        var parentData = $$.d3.select(this.parentNode).datum()
        $$.d3.select(this).datum(parentData)
      })
  return [
    (withTransition ? regions.transition(transition) : regions)
      .attr('x', $$.regionX.bind($$))
      .attr('y', $$.regionY.bind($$))
      .attr('width', $$.regionWidth.bind($$))
      .attr('height', $$.regionHeight.bind($$))
      .style('fill-opacity', function(d) {
        return isValue(d.opacity) ? d.opacity : 0.1
      }),
    (withTransition ? regionLabels.transition(transition) : regionLabels)
      .attr('x', $$.labelOffsetX.bind($$))
      .attr('y', $$.labelOffsetY.bind($$))
      .attr('transform', $$.labelTransform.bind($$))
      .attr('style', 'text-anchor: left;'),
    (withTransition ? regionStripes.transition() : regionStripes)
      .attr('x', $$.regionX.bind($$))
      .attr('y', $$.regionY.bind($$))
      .attr('width', $$.regionWidth.bind($$))
      .attr('height', 2)
      .style('fill-opacity', function(d) {
        return isValue(d.opacity) ? d.opacity : 1
      }),
    (withTransition ? regionTexts.transition() : regionTexts)
      .attr('x', -50)
      .attr('y', function(d) {
        return $$.regionX.bind($$)(d) + $$.regionWidth.bind($$)(d) / 2
      })
      .style('fill-opacity', function(d) {
        return isValue(d.opacity) ? d.opacity : 1
      })
  ]
  // === END PULSESHIFT CUSTOM EXTENSION ===
}
ChartInternal.prototype.regionX = function(d) {
  var $$ = this,
    config = $$.config,
    xPos,
    yScale = d.axis === 'y' ? $$.y : $$.y2
  if (d.axis === 'y' || d.axis === 'y2') {
    xPos = config.axis_rotated ? ('start' in d ? yScale(d.start) : 0) : 0
  } else {
    xPos = config.axis_rotated
      ? 0
      : 'start' in d
      ? $$.x($$.isTimeSeries() ? $$.parseDate(d.start) : d.start)
      : 0
  }
  return xPos
}
ChartInternal.prototype.regionY = function(d) {
  var $$ = this,
    config = $$.config,
    yPos,
    yScale = d.axis === 'y' ? $$.y : $$.y2
  if (d.axis === 'y' || d.axis === 'y2') {
    yPos = config.axis_rotated ? 0 : 'end' in d ? yScale(d.end) : 0
  } else {
    yPos = config.axis_rotated
      ? 'start' in d
        ? $$.x($$.isTimeSeries() ? $$.parseDate(d.start) : d.start)
        : 0
      : 0
  }
  return yPos
}
ChartInternal.prototype.regionWidth = function(d) {
  var $$ = this,
    config = $$.config,
    start = $$.regionX(d),
    end,
    yScale = d.axis === 'y' ? $$.y : $$.y2
  if (d.axis === 'y' || d.axis === 'y2') {
    end = config.axis_rotated
      ? 'end' in d
        ? yScale(d.end)
        : $$.width
      : $$.width
  } else {
    end = config.axis_rotated
      ? $$.width
      : 'end' in d
      ? $$.x($$.isTimeSeries() ? $$.parseDate(d.end) : d.end)
      : $$.width
  }
  return end < start ? 0 : end - start
}
ChartInternal.prototype.regionHeight = function(d) {
  var $$ = this,
    config = $$.config,
    start = this.regionY(d),
    end,
    yScale = d.axis === 'y' ? $$.y : $$.y2
  if (d.axis === 'y' || d.axis === 'y2') {
    end = config.axis_rotated
      ? $$.height
      : 'start' in d
      ? yScale(d.start)
      : $$.height
  } else {
    end = config.axis_rotated
      ? 'end' in d
        ? $$.x($$.isTimeSeries() ? $$.parseDate(d.end) : d.end)
        : $$.height
      : $$.height
  }
  return end < start ? 0 : end - start
}
ChartInternal.prototype.isRegionOnX = function(d) {
  return !d.axis || d.axis === 'x'
}
ChartInternal.prototype.labelRegion = function(d) {
  return 'label' in d ? d.label : ''
}
ChartInternal.prototype.labelTransform = function(d) {
  return 'vertical' in d && d.vertical ? 'rotate(90)' : ''
}
ChartInternal.prototype.labelOffsetX = function(d) {
  var paddingX = 'paddingX' in d ? d.paddingX : 3
  var paddingY = 'paddingY' in d ? d.paddingY : 3
  return 'vertical' in d && d.vertical
    ? this.regionY(d) + paddingY
    : this.regionX(d) + paddingX
}
ChartInternal.prototype.labelOffsetY = function(d) {
  var paddingX = 'paddingX' in d ? d.paddingX : 3
  var paddingY = 'paddingY' in d ? d.paddingY : 3
  return 'vertical' in d && d.vertical
    ? -(this.regionX(d) + paddingX)
    : this.regionY(d) + 10 + paddingY
}
