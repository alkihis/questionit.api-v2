import { User } from '../../database/entities/user.entity';
import { Connection, getConnection } from 'typeorm';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { getRightsAsObject } from '../utils/rights.utils';

export interface IRequestTokenInformation {
  rights: number;
  tokenId: string;
  expires: number;
  emission: number;
  applicationId: string | null;
}

export class RequestUserManager {
  private connection: Connection;

  // Rights are obtained from token, and designate things token has right to do.
  constructor(public entity: User, public requestTokenInformation: IRequestTokenInformation) {
    this.connection = getConnection();
  }

  static hasRight(rights: number, right: EApplicationRight) {
    return (rights & rights) !== 0;
  }

  hasRight(right: EApplicationRight) {
    return (this.rights & right) !== 0;
  }

  getRights() {
    return getRightsAsObject(this.rights);
  }

  isLoggedAsOfficialWebsite() {
    return this.hasRight(EApplicationRight.InternalUseOnly);
  }

  get id() {
    return this.entity.id;
  }

  get role() {
    return this.entity.role;
  }

  get rights() {
    return this.requestTokenInformation.rights;
  }
}
