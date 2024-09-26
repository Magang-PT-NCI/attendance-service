import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class PermitService {
  async handlePermit() {
    throw new NotImplementedException();
  }

  async handleUpdatePermit() {
    throw new NotImplementedException();
  }
}
