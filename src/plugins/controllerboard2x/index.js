var sharedFunctions = require('./public/js/telemetryToSystemPower.js');
var PREFERENCES_NS = 'plugins';

class SystemEnvironment
{
    constructor(name, deps)
    {
      deps.logger.debug('Controllerboard2x:SystemEnvironment plugin loaded');
    }
}

class SystemPower
{
    constructor(name, deps)
    {
      deps.logger.debug('Controllerboard2x:SystemPower plugin loaded');

      this.config   = deps.config;
      this.cockpit  = deps.cockpit;
      var self      = this;

      deps.cockpit.on('plugin.systemPower.powerESCs', function (enable)
      {
        if (enable)
        {
          deps.globalEventLoop.emit('mcu.SendCommand', 'escp(1)');
        } 
        else 
        {
          deps.globalEventLoop.emit('mcu.SendCommand', 'escp(0)');      
        }
      });
    }

    getSettingSchema()
    {
      // Technically the json-editor supports "watch" that can be used
      // to dynamically add items from an array as an ENUM to a select
      // in the same document.  Have an issue filed as I cannot get it
      // to work.  
      
      // WORKAROUND [REMOVED, SEE NOTE]: Manually parse the config for 
      // the Battery types and inject them in to the schema.
      // [NOTE]: Replaced with static configuration.

      // TODO: signal an update to the schema that is caches in several
      // spots when a Battery is changed.

      var BatteryOptions = [
        'TrustFire',
        'LiFePO4 (OpenROV White)',
        'High-Capacity NMC (OpenROV Blue)'
      ];

      // TODO:
      // If settings already exist, new defaults aren't available. 
      // Do we have an idiomatic way for upgrading old settings so that
      // renamed properties/values and new ones replace them?

      return [{
        'id':       'batteryDefinitions',
        'title':    'Battery Formulas',
        'category': 'hardware',        
        'type':     'object',

        'properties': 
        {
          'batteries': {
            'options': 
            {
              hidden: true
            },
            'id':   'batteries',
            'type': 'array',

            'items': {
              'id':   '0',
              'type': 'object',
              'properties': {
                'name': {
                  'id':   'name',
                  'type': 'string'
                },
                'minVoltage': {
                  'id':   'minVoltage',
                  'type': 'number'
                },
                'maxVoltage': {
                  'id':   'maxVoltage',
                  'type': 'number'
                }
              },
              'required': [
                'name',
                'minVoltage',
                'maxVoltage'
              ]
            },
            'default': 
            [
              {
                'name': 'TrustFire',
                'minVoltage': 8,
                'maxVoltage': 13
              },
              {
                'name': 'LiFePO4 (OpenROV White)',
                'minVoltage': 7,
                'maxVoltage': 10
              },
              {
                'name': 'High-Capacity NMC (OpenROV Blue)',
                'minVoltage': 8,
                'maxVoltage': 12.6
              }
            ]
          },
          'selectedBattery': 
          {
            'id':       'selectedBattery',
            'type':     'string',
            'enum':     BatteryOptions,
            'default':  'LiFePO4 (OpenROV White)'
          }
        },
        'required': 
        [
          'batteries',
          'selectedBattery'
        ]
      }];
    }
};

// Controller Board 2X Plugin
class Controllerboard2x
{
    constructor(name, deps)
    {
      deps.logger.debug('Controllerboard2x plugin loaded');

      this.systempower        = new SystemPower(name, deps);
      this.systemenvironment  = new SystemEnvironment(name, deps);
    }

    getSettingSchema() 
    {
      var item = this.systempower.getSettingSchema();
      return item;
    }
}

module.exports = function (name, deps)
{
  if( process.env.PRODUCTID == "trident" )
  {
      deps.logger.debug( "Not supported on trident" );
      return {};
  }

  return new Controllerboard2x(name, deps);
};