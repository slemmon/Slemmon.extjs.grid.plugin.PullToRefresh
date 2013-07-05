Ext.define('My.ux.plugin.PullToRefresh', {
    extend: 'Ext.AbstractPlugin',
    alias: 'plugin.pulltorefresh',
    
    dragTrackerConfig: {},
    refreshDist: 60,
    pullCtHtml: '<div style="padding-bottom:10px;"><div class="refresh-icon" style="margin-right:12px;"></div><span style="font-size:1.5em;">Pull to Refresh</span></div>',
    pullCtCfg: undefined,
    
    init: function (panel) {
        var me = this;
        
        me.panel = panel;
        panel.on({
            afterrender: me.onPanelRender,
            scope: me,
            single: true
        });
        
        me.pullCtCfg = me.pullCtCfg || {};
    },
    onPanelRender: function () {
        var me = this,
            panel = me.panel;
        
        me.dragTracker = new Ext.dd.DragTracker(Ext.apply({
            onBeforeStart: Ext.bind(me.onBeforeStart, me),
            onStart: Ext.bind(me.onStart, me),
            onDrag: Ext.bind(me.onDrag, me),
            onEnd: Ext.bind(me.onEnd, me)
        }, me.dragTrackerConfig,{
            el: panel.getEl()
        }));
    },
    onBeforeStart: function (e) {
        var me = this,
            panel = me.panel,
            delegateMet = true;
        
        if (me.dragTrackerConfig.delegate) {
            delegateMet = e.getTarget(me.dragTrackerConfig.delegate);
        } else if (panel.getHeader && panel.getHeader()) {
            delegateMet = e.within(panel.getHeader().getEl());
        }
        
        return delegateMet && !me.isPulling;
    },
    onStart: function (e) {
        var me = this,
            panel = me.panel;
        
        me.panelStartPos = panel.getView ? panel.getView().getRegion() : panel.getEl().getRegion();
        
        me.refreshMet = false;
        me.isPulling = true;
        me.getPullCt().setWidth(panel.getWidth());
        /*if (me.getPullCt().getEl()) {
            me.getPullCt().getEl().removeCls('will-refresh');
            me.getPullCt().getEl().removeCls('is-refreshing');
        }*/
    },
    onDrag: function (e) {
        var me = this,
            panel = me.panel,
            yDiff = e.getY() - me.dragTracker.startXY[1],
            pullCt = me.getPullCt(),
            showByTarget = panel.getView ? panel.getView() : panel,
            slowedPullDist;
        
        if (yDiff > 0) {
            if (yDiff < me.refreshDist) {
                showByTarget.getEl().position(null, null, me.panelStartPos.left, me.panelStartPos.top + yDiff);
                pullCt.setHeight(yDiff);
                pullCt.showBy(showByTarget , 'b-t');
                me.getPullCt().getEl().addCls('can-refresh');
                me.getPullCt().getEl().removeCls('will-refresh');
                me.refreshMet = false;
            } else { // refresh met now
                me.refreshMet = true;
                slowedPullDist = me.refreshDist + ((yDiff - me.refreshDist) / 4);
                showByTarget.getEl().position(null, null, me.panelStartPos.left, me.panelStartPos.top + slowedPullDist);
                pullCt.setHeight(slowedPullDist);
                pullCt.showBy(showByTarget, 'b-t');
                me.getPullCt().getEl().addCls('will-refresh');
            }
        } else {
            pullCt.hide();
        }
    },
    onEnd: function () {
        var me = this,
            panel = me.panel,
            showByTarget = panel.getView ? panel.getView() : panel;
        
        if (me.refreshMet === true) {
            me.getPullCt().animate({
                to: { height: me.refreshDist },
                dynamic: true
            });
            showByTarget.animate({
                to: {
                    y: me.panelStartPos.top + me.refreshDist
                },
                from: {
                    y: showByTarget.getEl().getTop()
                },
                callback: function () {
                    me.refresh();
                }
            });
        } else {
            me.collapsePullCt();
        }
    },
    refresh: function () {
        var me = this,
            panel = me.panel,
            store = panel.getStore();
        
        me.getPullCt().getEl().addCls('is-refreshing');
        
        store.on({
            load: me.collapsePullCt,
            scope: me,
            single: true
        });
        
        //store.reload();
        
        // pretend we're loading the store
        Ext.defer(function () { store.fireEvent('load'); }, 1200);
    },
    collapsePullCt: function () {
        var me = this,
            panel = me.panel,
            showByTarget = panel.getView ? panel.getView() : panel;

        me.getPullCt().animate({
            to: { height: 0 },
            dynamic: true,
            callback: function () {
                me.isPulling = false;
                me.getPullCt().getEl().removeCls('will-refresh');
                me.getPullCt().getEl().removeCls('is-refreshing');
            }
        });
        showByTarget.getEl().setRegion(me.panelStartPos, true);
    },
    destroy: function () {
        // destroy the PullCt
    },
    enable: function () {},
    disable: function () {},
    getPullCt: function () {
        var me = this,
            panel = me.panel;
        
        if (!me.pullCt) {
            me.pullCt = new Ext.container.Container(Ext.apply({
                floating: true,
                shadow: false,
                layout: {
                    type: 'vbox',
                    pack: 'center',
                    align: 'center'
                },
                items: [{
                    xtype: 'component',
                    html: me.pullCtHtml
                }]
            }, me.pullCtCfg));
        }
        return me.pullCt;
    }
});