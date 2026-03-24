// This module will be imported dynamically to avoid circular dependencies
let io: any = null;

export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

export const getSocketIO = () => {
  return io;
};

export const emitOrderUpdate = (event: string, data: any) => {
  if (io) {
    io.to('kitchen').emit(event, data);
    io.to('cashier').emit(event, data);
  }
};

export const emitToKitchen = (event: string, data: any) => {
  if (io) {
    io.to('kitchen').emit(event, data);
  }
};

export const emitToCashier = (event: string, data: any) => {
  if (io) {
    io.to('cashier').emit(event, data);
  }
};
