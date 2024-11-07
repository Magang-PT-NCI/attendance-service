import { NotificationBuilder } from '../../builders/notification.builder';

describe('NotificationBuilder', () => {
  let builder: NotificationBuilder;

  beforeEach(() => {
    builder = new NotificationBuilder();
  });

  it('should initialize with empty notifications arrays', () => {
    const notifications = builder.getNotifications();
    expect(notifications).toEqual([]);
  });

  it('should push attendance notification', () => {
    builder
      .setNik('12345')
      .setName('John Doe')
      .setMessage('Attendance notification')
      .setDate('2024-10-19')
      .setPriority(1)
      .push();

    const notifications = builder.getNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual({
      nik: '12345',
      name: 'John Doe',
      message: 'Attendance notification',
      date: '2024-10-19',
      file: null,
      action_endpoint: null,
    });
  });

  it('should push permit notification', () => {
    builder
      .setNik('54321')
      .setName('Jane Doe')
      .setMessage('Permit notification')
      .setDate('2024-10-19')
      .setPriority(1)
      .push();

    const notifications = builder.getNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual({
      nik: '54321',
      name: 'Jane Doe',
      message: 'Permit notification',
      date: '2024-10-19',
      file: null,
      action_endpoint: null,
    });
  });

  it('should push overtime notification', () => {
    builder
      .setNik('67890')
      .setName('Bob Smith')
      .setMessage('Overtime notification')
      .setDate('2024-10-19')
      .setPriority(1)
      .push();

    const notifications = builder.getNotifications();
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toEqual({
      nik: '67890',
      name: 'Bob Smith',
      message: 'Overtime notification',
      date: '2024-10-19',
      file: null,
      action_endpoint: null,
    });
  });

  it('should clear fields after push', () => {
    builder
      .setNik('12345')
      .setName('John Doe')
      .setMessage('Attendance notification')
      .setDate('2024-10-19')
      .push();

    expect((builder as any).message).toBe('');
    expect((builder as any).date).toBe('');
    expect((builder as any).file).toBe(null);
    expect((builder as any).action_endpoint).toBe(null);
  });

  it('should sort notifications with overtime first, then permit, then attendance', () => {
    builder
      .setNik('123')
      .setName('User A')
      .setMessage('Attendance')
      .setDate('2024-10-19')
      .setPriority(3)
      .push();

    builder
      .setNik('456')
      .setName('User B')
      .setMessage('Permit')
      .setDate('2024-10-19')
      .setPriority(2)
      .push();

    builder
      .setNik('789')
      .setName('User C')
      .setMessage('Overtime')
      .setDate('2024-10-19')
      .setPriority(1)
      .push();

    const notifications = builder.getNotifications();
    expect(notifications[0].message).toBe('Overtime');
    expect(notifications[1].message).toBe('Permit');
    expect(notifications[2].message).toBe('Attendance');
  });
});
