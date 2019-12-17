import CLASS from './class';
import {
    ChartInternal
} from './core';
import {
    isValue,
    isFunction,
    isArray,
    isString,
    sanitise
} from './util';

ChartInternal.prototype.initTooltip = function () {
    var $$ = this,
        config = $$.config,
        i;
    $$.tooltip = $$.selectChart
        .style("position", "relative")
        .append("div")
        .attr('class', CLASS.tooltipContainer)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("display", "none");
    // Show tooltip if needed
    if (config.tooltip_init_show) {
        if ($$.isTimeSeries() && isString(config.tooltip_init_x)) {
            config.tooltip_init_x = $$.parseDate(config.tooltip_init_x);
            for (i = 0; i < $$.data.targets[0].values.length; i++) {
                if (($$.data.targets[0].values[i].x - config.tooltip_init_x) === 0) {
                    break;
                }
            }
            config.tooltip_init_x = i;
        }
        $$.tooltip.html(config.tooltip_contents.call($$, $$.data.targets.map(function (d) {
            return $$.addName(d.values[config.tooltip_init_x]);
        }), $$.axis.getXAxisTickFormat(), $$.getYFormat($$.hasArcType()), $$.color));
        $$.tooltip.style("top", config.tooltip_init_position.top)
            .style("left", config.tooltip_init_position.left)
            .style("display", "block");
    }
};
ChartInternal.prototype.getTooltipSortFunction = function () {
    var $$ = this,
        config = $$.config;

    if (config.data_groups.length === 0 || config.tooltip_order !== undefined) {
        // if data are not grouped or if an order is specified
        // for the tooltip values we sort them by their values

        var order = config.tooltip_order;
        if (order === undefined) {
            order = config.data_order;
        }

        var valueOf = function (obj) {
            return obj ? obj.value : null;
        };

        // if data are not grouped, we sort them by their value
        if (isString(order) && order.toLowerCase() === 'asc') {
            return function (a, b) {
                return valueOf(a) - valueOf(b);
            };
        } else if (isString(order) && order.toLowerCase() === 'desc') {
            return function (a, b) {
                return valueOf(b) - valueOf(a);
            };
        } else if (isFunction(order)) {

            // if the function is from data_order we need
            // to wrap the returned function in order to format
            // the sorted value to the expected format

            var sortFunction = order;

            if (config.tooltip_order === undefined) {
                sortFunction = function (a, b) {
                    return order(a ? {
                        id: a.id,
                        values: [a]
                    } : null, b ? {
                        id: b.id,
                        values: [b]
                    } : null);
                };
            }

            return sortFunction;

        } else if (isArray(order)) {
            return function (a, b) {
                return order.indexOf(a.id) - order.indexOf(b.id);
            };
        }
    } else {
        // if data are grouped, we follow the order of grouped targets
        var ids = $$.orderTargets($$.data.targets).map(function (i) {
            return i.id;
        });

        // if it was either asc or desc we need to invert the order
        // returned by orderTargets
        if ($$.isOrderAsc() || $$.isOrderDesc()) {
            ids = ids.reverse();
        }

        return function (a, b) {
            return ids.indexOf(a.id) - ids.indexOf(b.id);
        };
    }
};
ChartInternal.prototype.getTooltipContent = function (d, defaultTitleFormat, defaultValueFormat, color) {
    var $$ = this,
        config = $$.config,
        titleFormat = config.tooltip_format_title || defaultTitleFormat,
        nameFormat = config.tooltip_format_name || function (name) { return name; },
        valueFormat = config.tooltip_format_value || defaultValueFormat,
        text, i, title, value, name, bgcolor,
        orderAsc = $$.isOrderAsc();

        //create an array that contains any CI's high AND low values as seperate entries
        var completeArray = [];//.concat(d);
        var offset=0;

        for (i = 0; i < d.length; i++) {
            if (! (d[i])) {
                offset++;
                continue; }
            
            //append the data for one graph
            completeArray.push({
                id: d[i].id,
                value: d[i].value,
                name: d[i].name,
                index: d[i].index,
                x: d[i].x
            });
            
            
            //append high and low data for ribbon type
            if($$.isRibbonType(d[i])){
                var sName = d[i].name;
                //create a new element and append it to the array for the low value
                completeArray.push({
                    id: d[i].id,
                    value: d[i].ribbonYs.low,
                    name: sName.concat(" low"),
                    index: d[i].index,
                    ribbonYs: d[i].ribbonYs,
                    x: d[i].x
                });
                //change original CI element to represent the high value
                completeArray[i-offset].value = d[i].ribbonYs.high;
                completeArray[i-offset].name = sName.concat(" high");
            }
        }


    if (config.data_groups.length === 0) {
        completeArray.sort(function(a, b){
            var v1 = a ? a.value : null, v2 = b ? b.value : null;
            return orderAsc ? v1 - v2 : v2 - v1;
        });
    } else {
        var ids = $$.orderTargets($$.data.targets).map(function (i) {
            return i.id;
        });
        completeArray.sort(function(a, b) {
            var v1 = a ? a.value : null, v2 = b ? b.value : null;
            if (v1 > 0 && v2 > 0) {
                v1 = a ? ids.indexOf(a.id) : null;
                v2 = b ? ids.indexOf(b.id) : null;
            }
            return orderAsc ? v1 - v2 : v2 - v1;
        });
    }

    for (i = 0; i < completeArray.length; i++) {
        if (! (completeArray[i] && (completeArray[i].value || completeArray[i].value === 0))) { continue; }

        if($$.isStanfordGraphType()) {
            // Custom tooltip for stanford plots
            if (!text) {
                title = $$.getStanfordTooltipTitle(completeArray[i]);
                text = "<table class='" + $$.CLASS.tooltip + "'>" + title;
            }

            bgcolor = $$.getStanfordPointColor(completeArray[i]);
            name = sanitise(config.data_epochs); // Epochs key name
            value = completeArray[i].epochs;
        } else {
            // Regular tooltip
            if (!text) {
                title = sanitise(titleFormat ? titleFormat(completeArray[i].x, completeArray[i].index) : completeArray[i].x);
                text = "<table class='" + $$.CLASS.tooltip + "'>" + (title || title === 0 ? "<tr><th colspan='2'>" + title + "</th></tr>" : "");
            }

            value = sanitise(valueFormat(completeArray[i].value, completeArray[i].ratio, completeArray[i].id, completeArray[i].index, completeArray));
            if (value !== undefined) {
                // Skip elements when their name is set to null
                if (completeArray[i].name === null) {
                    continue;
                }

                name = sanitise(nameFormat(completeArray[i].name, completeArray[i].ratio, completeArray[i].id, completeArray[i].index));
                bgcolor = $$.levelColor ? $$.levelColor(completeArray[i].value) : color(completeArray[i].id);
            }
        }

        if (value !== undefined) {
            // Skip elements when their name is set to null
            if (completeArray[i].name === null) { continue; }

            text += "<tr class='" + $$.CLASS.tooltipName + "-" + $$.getTargetSelectorSuffix(completeArray[i].id) + "'>";
            text += "<td class='name'><span style='background-color:" + bgcolor + "'></span>" + name + "</td>";
            text += "<td class='value'>" + value + "</td>";
            text += "</tr>";
        }
    }
    return text + "</table>";
};
ChartInternal.prototype.tooltipPosition = function (dataToShow, tWidth, tHeight, element) {
    var $$ = this,
        config = $$.config,
        d3 = $$.d3;
    var svgLeft, tooltipLeft, tooltipRight, tooltipTop, chartRight;
    var forArc = $$.hasArcType(),
        mouse = d3.mouse(element);
    // Determin tooltip position
    if (forArc) {
        tooltipLeft = (($$.width - ($$.isLegendRight ? $$.getLegendWidth() : 0)) / 2) + mouse[0];
        tooltipTop = ($$.hasType('gauge') ? $$.height : $$.height / 2) + mouse[1] + 20;
    } else {
        svgLeft = $$.getSvgLeft(true);
        if (config.axis_rotated) {
            tooltipLeft = svgLeft + mouse[0] + 100;
            tooltipRight = tooltipLeft + tWidth;
            chartRight = $$.currentWidth - $$.getCurrentPaddingRight();
            tooltipTop = $$.x(dataToShow[0].x) + 20;
        } else {
            tooltipLeft = svgLeft + $$.getCurrentPaddingLeft(true) + $$.x(dataToShow[0].x) + 20;
            tooltipRight = tooltipLeft + tWidth;
            chartRight = svgLeft + $$.currentWidth - $$.getCurrentPaddingRight();
            tooltipTop = mouse[1] + 15;
        }

        if (tooltipRight > chartRight) {
            // 20 is needed for Firefox to keep tooltip width
            tooltipLeft -= tooltipRight - chartRight + 20;
        }
        if (tooltipTop + tHeight > $$.currentHeight) {
            tooltipTop -= tHeight + 30;
        }
    }
    if (tooltipTop < 0) {
        tooltipTop = 0;
    }
    return {
        top: tooltipTop,
        left: tooltipLeft
    };
};
c3_chart_internal_fn.showTooltip = function (selectedData, element) {
    var $$ = this,
        config = $$.config;
    var tWidth, tHeight, position;
    var forArc = $$.hasArcType(),
        dataToShow = selectedData.filter(function (d) {
        if (d) {var ribbonIsValue = (d.ribbonYs == undefined) ? null : (isValue(d.ribbonYs.high) && isValue(d.ribbonYs.low));}
        return d && (isValue(d.value) || ribbonIsValue);
    }),
        positionFunction = config.tooltip_position || c3_chart_internal_fn.tooltipPosition;
    if (dataToShow.length === 0 || !config.tooltip_show) {
        return;
    }
    $$.tooltip.html(config.tooltip_contents.call($$, selectedData, $$.axis.getXAxisTickFormat(), $$.getYFormat(forArc), $$.color)).style("display", "block");

    // Get tooltip dimensions
    tWidth = $$.tooltip.property('offsetWidth');
    tHeight = $$.tooltip.property('offsetHeight');

    position = positionFunction.call(this, dataToShow, tWidth, tHeight, element);
    // Set tooltip
    $$.tooltip.style("top", position.top + "px").style("left", position.left + 'px');
};
ChartInternal.prototype.hideTooltip = function () {
    this.tooltip.style("display", "none");
};
