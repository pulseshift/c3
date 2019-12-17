import { Chart } from './core';
import { isValue, isDefined } from './util';

Chart.prototype.axis = function () {};
Chart.prototype.axis.labels = function (labels) {
    var $$ = this.internal;
    if (arguments.length) {
        Object.keys(labels).forEach(function (axisId) {
            $$.axis.setLabelText(axisId, labels[axisId]);
        });
        $$.axis.updateLabels();
    }
    // TODO: return some values?
};
Chart.prototype.axis.max = function (max) {
    var $$ = this.internal, config = $$.config;
    if (arguments.length) {
        if (typeof max === 'object') {
            if (isValue(max.x)) { config.axis_x_max = max.x; }
            if (isValue(max.y)) { config.axis_y_max = max.y; }
            if (isValue(max.y2)) { config.axis_y2_max = max.y2; }
        } else {
            config.axis_y_max = config.axis_y2_max = max;
        }
        $$.redraw({withUpdateOrgXDomain: true, withUpdateXDomain: true});
    } else {
        return {
            x: config.axis_x_max,
            y: config.axis_y_max,
            y2: config.axis_y2_max
        };
    }
};
Chart.prototype.axis.min = function (min) {
    var $$ = this.internal, config = $$.config;
    if (arguments.length) {
        if (typeof min === 'object') {
            if (isValue(min.x)) { config.axis_x_min = min.x; }
            if (isValue(min.y)) { config.axis_y_min = min.y; }
            if (isValue(min.y2)) { config.axis_y2_min = min.y2; }
        } else {
            config.axis_y_min = config.axis_y2_min = min;
        }
        $$.redraw({withUpdateOrgXDomain: true, withUpdateXDomain: true});
    } else {
        return {
            x: config.axis_x_min,
            y: config.axis_y_min,
            y2: config.axis_y2_min
        };
    }
};
Chart.prototype.axis.range = function (range) {
    if (arguments.length) {
        if (isDefined(range.max)) { this.axis.max(range.max); }
        if (isDefined(range.min)) { this.axis.min(range.min); }
    } else {
        return {
            max: this.axis.max(),
            min: this.axis.min()
        };
    }
};

Chart.prototype.axis.types = function (types) {
    const $$ = this.internal;
    if (types === undefined) {
        return {
            y: $$.config.axis_y_type,
            y2: $$.config.axis_y2_type
        };
    } else {
        if (isDefined(types.y)) {
            $$.config.axis_y_type = types.y;
        }

        if (isDefined(types.y2)) {
            $$.config.axis_y2_type = types.y2;
        }

        $$.updateScales();
        $$.redraw();
    }
};

// === START PULSESHIFT CUSTOM EXTENSION ===

// show/hide Y2 axis by API
Chart.prototype.axis.showY2 = function(shown) {
    let $$ = this.internal, config = $$.config
    config.axis_y2_show = !!shown
    $$.axes.y2.style(
    'visibility',
    config.axis_y2_show ? 'visible' : 'hidden'
    )
    $$.redraw()
}

// show/hide Y axis by API
Chart.prototype.axis.showY = function(shown) {
    let $$ = this.internal, config = $$.config
    config.axis_y_show = !!shown
    $$.axes.y.style('visibility', config.axis_y_show ? 'visible' : 'hidden')
    $$.redraw()
}

// show/hide X axis by API
Chart.prototype.axis.showX = function(shown) {
    let $$ = this.internal, config = $$.config
    config.axis_x_show = !!shown
    $$.axes.x.style('visibility', config.axis_x_show ? 'visible' : 'hidden')
    $$.redraw()
}

// === END PULSESHIFT CUSTOM EXTENSION ===
