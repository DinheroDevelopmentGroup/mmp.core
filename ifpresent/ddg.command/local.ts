import { registerCommand } from '../../../ddg.command/manager.js';
import core from '../../local.js';

registerCommand('cb', (...args) => {
  const command = args.join(' ');

  core.run(command);
});
