/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

DATA_FTBaseSystem = Ext.extend(Ext.util.Observable,
{
    f_initDataType: function()
    {
        ///////////////////////////////////////////////////////
        //
        this.m_headerPanel = undefined;
        this.m_footerPanel = undefined;
        this.m_bodyPanel = undefined;
        this.m_tabNames = [ 'Business LiveBox settings',
                    'Open Appliance settings', 'UTM configuration',
                    'PBX configuration', '3rd Parties Applications'];
        this.m_selTab = this.m_tabNames[1];

        //////////////////////////////////////////////////////
        //an array of panels object belong to specific tab
        this.systemTabObjects = new Array();
        this.m_homePage = 'ft_main.html';
    },

    ///////////////////////////////////
    //
    f_getSystemTabNames: function()
    {
        return this.m_tabNames;
    },


    ///////////////////////////////////////////
    //

    f_setSystemTabPanels: function(tabObjects)
    {
        this.systemTabObjects = tabObjects;
    },

    ///////////////////////////////////////////////////
    // Tabs data
    /**
     * if tabIndex is provided, return that specific tab.
     * else return all tabs in an array form.
     */
    f_getTabsData: function(tabIndex /*optional*/)
    {
        var tabs = [ [this.m_tabNames[0], 'tabnav_blb_'],
                  [this.m_tabNames[1], 'tabnav_oa_'],
                  [this.m_tabNames[2], 'tabnav_utm_'],
                  [this.m_tabNames[3], 'tabnav_pbx_'],
                  [this.m_tabNames[4], 'tabnav_3pa_']];

        if(tabIndex == undefined)
            return tabs;
        else
            return tabs[tabIndex];
    }
});


////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
function f_startLogin()
{
    /////////////////////////////////////////////////
    // create a login object and add it to manager
    var loginObject = new v_loginPanelObject('login');
    loginObject.m_name = 'login';
    loginObject.f_initLoginPanel(g_ftBaseSystem);
}

function f_startOpenAppliance()
{
    //////////////////////////////////////////////////
    // get system main frame body panel
    var bp = g_ftBaseSystem.m_bodyPanel;

    /////////////////////////////////////////////////
    // create a application object and add it to manager
    var opObject = new v_opPanelObject(bp,
                  g_ftBaseSystem.f_getTabsData(1)[0]);
    //g_panelsMgr.f_manageThisPanel(opObject);

    bp.add(opObject.f_getMainPanel());

    ////////////////////////////////////////////
    // register the panel resize listener
    bp.on( {'resize': {fn: function(){opObject.f_resizePanels(bp) }}});

    //////////////////////////////////////////////
    // let update the layout
    opObject.f_resizePanels(bp);
    bp.doLayout();
}

function f_startVyattaApplication()
{
    var iframe = Ext.DomHelper.append(document.body,
    {
        tag: 'iframe',
        frameBorder:0,
        src: '../Vyatta/main.html',
        width: '100%',
        height: '100%'
    });

    var pp = new Ext.Panel(
    {
        contentEl: iframe
        ,border: false
    });

    var bp = g_ftBaseSystem.m_bodyPanel;
    bp.add(pp);
    bp.doLayout();
}

////////////////////////////////////////////////////////////////////////////////
// g_3rdPartyURL is provided from server by call getOpenApplianceVM.
g_3rdPartyURL = null;
function f_start3rdPartyApplication()
{
    if(g_3rdPartyURL != null)
    {
        var iframe = Ext.DomHelper.append(document.body,
        {
            tag: 'iframe',
            frameBorder:0,
            src:g_3rdPartyURL,
            width: '100%',
            height: '100%'
        });

        var pp = new Ext.Panel(
        {
            contentEl: iframe
            ,border: false
        });

        var bp = g_ftBaseSystem.m_bodyPanel;
        bp.add(pp);
        bp.doLayout();
    }
    else
        f_startEmptyApplication();
}

function f_initWelcomePanel()
{
    var el = document.getElementById('barre_etat');
    el.innerHTML = "<span>&nbsp;&nbsp;Welcome <font color=#FF6600><b>" + f_getUserLoginName() +
                  "</b></font>! You are connected to the Open Appliance administrative service.</span>" +
                  "<a href='#' onclick='f_userLogout(true, \"" +
                  g_ftBaseSystem.m_homePage +
                  "\")' class='dec' onfocus='this.blur();'>log out</a>";
}

function f_showApplication(appIndex)
{
    var bp = g_ftBaseSystem.m_bodyPanel;

    /////////////////////////////////////////////////////
    // let find out the application you selection is
    // implemented

    /////////////////////////////////////////////
    // clean up body panel
    while(bp.items.getCount() > 0)
    {
        var rItem = bp.items.remove(bp.items.itemAt(0));
        if(rItem instanceof Object)
        {
            rItem.hide();
            delete rItem;
        }
    }

    switch(g_ftBaseSystem.f_getTabsData(appIndex)[1])
    {
        case 'tabnav_utm_':
            f_startVyattaApplication();
        break;
        case 'tabnav_3pa_':
            f_start3rdPartyApplication();
        break;
        case 'tabnav_oa_':
            f_startOpenAppliance();
        break;
        default:
            f_startEmptyApplication();
    }
}

function f_startEmptyApplication()
{
    var bp = g_ftBaseSystem.m_bodyPanel;
    var ePanel = f_createEmptyPanel(
                  'The application you selected is not yet implemented.');

    ePanel.setSize(bp.getSize().width, bp.getSize().height);

    bp.add(ePanel);
    bp.doLayout();
}

function f_initTabPanel(tabIndex)
{
    g_ftBaseSystem.m_selTab = g_ftBaseSystem.f_getTabsData(tabIndex)[0];
    f_refreshTabs();
}

function f_handleOnTabClick(tabIndex)
{
    if(!f_isUserLogined(true, true))
    {
        window.location = 'ft_main.html';
        return;
    }

    g_ftBaseSystem.m_selTab = g_ftBaseSystem.f_getTabsData(tabIndex)[0];
    f_refreshTabs();

    f_showApplication(tabIndex);
}

function f_refreshTabs()
{
    var tabs = g_ftBaseSystem.f_getTabsData();

    var str = '<table id="nav_primaire1">' +
              '<tr>';

    for(var i=0; i<tabs.length; i++)
    {
        var tab = tabs[i];
        var isOn = (tab[0] == g_ftBaseSystem.m_selTab) ? 'on' : 'off';

        str += '<td><a href="#" onClick="f_handleOnTabClick('+ i +
                    ')" onfocus="this.blur();">'+
                    '<img src="images/' + tab[1] + isOn + '.png"></a></td>';
    }
    str += "</tr></table>";

    var el = document.getElementById('nav_primaire');
    if(el == undefined)
    {
        Ext.getBody().createChild({tag:'div', id:'nav_primaire', html: str});
        el = document.getElementById('nav_primaire');
    }
    el.innerHTML = str;
}

function f_initSystemObjects()
{
    g_ftBaseSystem = new DATA_FTBaseSystem();
    g_ftBaseSystem.f_initDataType();
    g_sendCommandWait = null;
}

////////////////////////////////////////////////////////////////////////////////
// start of the veiw port main frame
////////////////////////////////////////////////////////////////////////////////
// create view main panels
function f_createFrameHeaderPanel()
{
    var header = new Ext.Panel(
    {
        border: false
        ,bodyBorder: false
        ,bodyStyle: 'padding: 8px 10px 8px 10px'
        ,contentEl: 'id_header'
    });

    return header;
}
function f_createFrameFooterPanel()
{
    var footer = new Ext.Panel(
    {
        //height: 28
        border: false
        ,bodyBorder: false
        ,contentEl: 'id_footer'
    });

    return footer;
}
function f_createFrameBodyPanel()
{
    var bodyPanel = new Ext.Panel(
    {
        border: false
        ,bodyBorder: false
        ,width: 600
        ,height: 300
        ,contentEl: 'id_center_panel'
    });

    return bodyPanel;
}

function f_createMainFramePanel()
{
    g_ftBaseSystem.m_headerPanel = f_createFrameHeaderPanel();
    g_ftBaseSystem.m_footerPanel = f_createFrameFooterPanel();
    g_ftBaseSystem.m_bodyPanel = f_createFrameBodyPanel();

    var mainFramePanel = new Ext.Panel(
    {
        border: false
        ,columnWidth: .94
        ,items:
        [
            g_ftBaseSystem.m_headerPanel,
            g_ftBaseSystem.m_bodyPanel,
            g_ftBaseSystem.m_footerPanel
        ]
    });

    return mainFramePanel;
}

function f_handleMainFramePanelResize()
{
    if(g_ftBaseSystem.m_viewPort != undefined)
    {
        var v = g_ftBaseSystem.m_viewPort;
        var b = g_ftBaseSystem.m_bodyPanel;
        var h = g_ftBaseSystem.m_headerPanel;
        var f = g_ftBaseSystem.m_footerPanel;

        b.setSize(g_ftBaseSystem.m_mainFrame.getSize().width,
                  v.getSize().height-h.getSize().height - f.getSize().height);
    }
}

////////////////////////////////////////////////////////////////////////////////
function f_createUnuseSidePanel()
{
    var spanel = new Ext.Panel(
    {
        columnWidth: .03
        ,border: false
        ,html: '&nbsp;'
    });

    return spanel;
}

function f_startViewPort()
{
    var mf = f_createMainFramePanel();

    var vp = new Ext.Viewport(
    {
      layout: 'column'
      ,border: false
      ,bodyBorder: false
      ,items:
      [
          f_createUnuseSidePanel()
          ,mf
          ,f_createUnuseSidePanel()
      ]
    });

    g_ftBaseSystem.m_viewPort = vp;
    g_ftBaseSystem.m_mainFrame = mf;

    vp.on( {'resize': {fn:
                function() {f_handleMainFramePanelResize()}}});
}

function onLanguageChange()
{
    var el = document.getElementById('ft_language');


}
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////
Ext.onReady(function()
{
    ////////////////////////////////////////////////
    // quick tip init.....
    Ext.QuickTips.init();

    ///////////////////////////////////////////////
    // init system base object and data members
    f_initSystemObjects();


    /////////////////////////////////////////
    // start up the main frame
    f_startViewPort();

    //////////////////////////////////////////
    // if user not login yet, do login here..
    if(!f_isUserLogined(false, false))
        f_startLogin();
    else
    {
        f_initWelcomePanel();
        f_initTabPanel(1);
        f_startOpenAppliance(1);
    }

    ////////////////////////////////////////////
    // resize window
    f_handleMainFramePanelResize();
});