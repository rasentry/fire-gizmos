(function () {
Editor.registerWidget( 'svg-gizmos-view', {
    is: 'svg-gizmos-view',

    properties: {
        scale: {
            type: Number,
            value: 1.0,
        },

        transformTool: {
            type: String,
            value: 'move',
            observer: '_updateTransformGizmo'
        },

        coordinate: {
            type: String,
            value: 'local',
            observer: '_updateTransformGizmo'
        },

        pivot: {
            type: String,
            value: 'pivot',
            observer: '_updateTransformGizmo'
        },
    },

    created: function () {
    },

    ready: function () {
        this._selection = [];

        this._svg = SVG(this.$.svg);
        this._svg.spof();

        this.scene = this._svg.group();
        this.foreground = this._svg.group();
    },

    attached: function () {
        this.async(function() {
            this.lightDomReady();
        });
    },

    lightDomReady: function() {
        this.resize();
    },

    resize: function ( w, h ) {
        if ( !w || !h ) {
            var bcr = this.$.view.getBoundingClientRect();
            w = w || bcr.width;
            h = h || bcr.height;

            w = Math.round(w);
            h = Math.round(h);
        }

        this._svg.size( w, h );
        this._svg.spof();
    },

    update: function () {
        if ( this._transformGizmo ) {
            this._transformGizmo.update();
        }
    },

    repaintHost: function () {
        if ( Fire.engine ) {
            Fire.engine.repaintInEditMode();
        }
    },

    // override this function to make it work with your scene-view
    sceneToPixel: function (v2) { return v2; },

    // override this function to make it work with your scene-view
    worldToPixel: function (v2) { return v2; },

    // override this function to make it work with your scene-view
    pixelToScene: function (v2) { return v2; },

    // override this function to make it work with your scene-view
    pixelToWorld: function (v2) { return v2; },

    updateSelectRect: function ( x, y, w, h ) {
        if ( !this._selectRect ) {
            this._selectRect = this.foreground.rect().front();
        }

        this._selectRect
            .move( Editor.GizmosUtils.snapPixel(x), Editor.GizmosUtils.snapPixel(y) )
            .size( w, h )
            .fill( { color: 'rgba(0,128,255,0.4)' } )
            .stroke( { width: 1, color: '#09f', opacity: 1.0 } )
            ;
    },

    fadeoutSelectRect: function() {
        if (!this._selectRect) {
            return;
        }
        var selectRect = this._selectRect;
        selectRect.animate(200, '-').opacity(0.0).after(function() {
            selectRect.remove();
        });
        this._selectRect = null;
    },

    rectHitTest: function(x, y, w, h) {
        var rect = this._svg.node.createSVGRect();
        rect.x = x;
        rect.y = y;
        rect.width = w;
        rect.height = h;
        var els = this._svg.node.getIntersectionList(rect, null);
        var results = [];
        for (var i = 0; i < els.length; ++i) {
            var el = els[i];
            var node = el.instance;
            if (node && node.selectable) {
                results.push(node);
            }
        }
        return results;
    },

    reset: function () {
        this._selection = [];
        if ( this._transformGizmo ) {
            this._transformGizmo.remove();
            this._transformGizmo = null;
        }
        this.scene.clear();
        this.foreground.clear();
    },

    select: function ( nodes ) {
        this._selection = this._selection.concat(nodes);

        for ( var i = 0; i < this._selection.length; ++i ) {
            var node = this._selection[i];
            if ( node && node.gizmo ) {
                node.gizmo.selecting = true;
                node.gizmo.editing = false;
            }
        }

        this.edit(this._selection);
    },

    unselect: function ( nodes ) {
        for ( var i = 0; i < nodes.length; ++i ) {
            var node = nodes[i];
            if ( node ) {
                for ( var j = 0; j < this._selection.length; ++j ) {
                    if ( this._selection[j].id === node.id ) {
                        this._selection.splice(j,1);
                        break;
                    }
                }

                if ( node.gizmo ) {
                    node.gizmo.selecting = false;
                    node.gizmo.editing = false;
                }
            }
        }

        this.edit(this._selection);
    },

    edit: function ( nodes ) {
        if ( nodes.length === 0 ) {
            if ( this._transformGizmo ) {
                this._transformGizmo._nodes = [];
            }
            this.repaintHost();
            return;
        }

        if ( nodes.length === 1 ) {
            node = nodes[0];
            if ( node.gizmo ) {
                node.gizmo.selecting = false;
                node.gizmo.editing = true;
            }
        }

        var gizmoDef;

        //
        switch ( this.transformTool ) {
            case 'move': gizmoDef = Editor.gizmos.move; break;
            case 'rotate': gizmoDef = Editor.gizmos.rotate; break;
            case 'scale': gizmoDef = Editor.gizmos.scale; break;
        }

        if ( !gizmoDef ) {
            Editor.error( 'Unknown transform tool %s', this.transformTool );
            this.repaintHost();
            return;
        }

        if ( this._transformGizmo && this._transformGizmo instanceof gizmoDef ) {
            this._transformGizmo._nodes = nodes;
        }
        else {
            if ( this._transformGizmo ) {
                this._transformGizmo.remove();
            }
            this._transformGizmo = new gizmoDef( this, nodes );
            this._transformGizmo.update();
        }

        this.repaintHost();
    },

    hoverin: function ( node ) {
        if ( node.gizmo ) {
            node.gizmo.hovering = true;
            this.repaintHost();
        }
    },

    hoverout: function ( node ) {
        if ( node.gizmo ) {
            node.gizmo.hovering = false;
            this.repaintHost();
        }
    },

    _updateTransformGizmo: function () {
        if ( this._transformGizmo ) {
            this.edit(this._transformGizmo._nodes);
        }
    },
});

})();
