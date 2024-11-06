import { Vec3 } from 'vec3';

import chat from '../ddg.chat/local.js';
import { pose } from '../ddg.pose/local.js';
import proxy from '../internal.proxy/local.js';

export class Core {
  public position: Vec3;
  public size: Vec3;

  constructor(position: Vec3, size: Vec3) {
    this.position = position;
    this.size = size;
  }

  public fill(): void {
    const size = this.size;

    const start = this.position;
    const end = start.plus(size);

    chat.toServer(
      `/fill ${start.toArray().join(' ')} ${end.toArray().join(' ')} command_block`,
    );
  }

  private readonly offset = new Vec3(0, 0, 0);

  public run(command: string): void {
    const offset = this.offset;
    const size = this.size;

    offset.x++;

    if (offset.x > size.x) {
      offset.x = 0;
      offset.y++;
    }

    if (offset.y > size.y) {
      offset.y = 0;
      offset.z++;
    }

    if (offset.z > size.z) {
      offset.z = 0;
    }

    const position = this.position.plus(offset);

    proxy.writeUpstream('update_command_block', {
      location: position,
      command,
      // 0 = Chain
      // 1 = Repeat
      // 2 = Impulse
      mode: 1,
      // 0bXX1 = Track Output
      // 0bX1X = Conditional
      // 0b1XX = Automatic
      flags: 0b100,
    });
  }
}

export const core = new Core(new Vec3(NaN, 0, NaN), new Vec3(16, 16, 16));

export default core;

pose.bi.on('position', () => {
  const position = pose.position.clone();

  // no scalar division 😭
  position.scale(1 / 16);
  position.floor();
  position.scale(16);

  if (
    Math.abs(core.position.x - position.x) < 256 &&
    Math.abs(core.position.z - position.z) < 256
  )
    return;

  core.position.x = position.x;
  core.position.z = position.z;

  core.fill();
});

chat.downstream.on('system', (data, packet) => {
  if (packet === undefined) return;

  if (data.positionId !== 1) return;

  let message;

  try {
    message = JSON.parse(data.formattedMessage);
  } catch {
    return;
  }

  if (!('translate' in message)) return;

  const translate = message.translate;

  if (typeof translate !== 'string') return;

  if (translate !== 'advMode.setCommand.success') return;

  console.debug(`canceled ${packet.name}`);

  packet.canceled = true;
});
