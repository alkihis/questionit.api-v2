import {MigrationInterface, QueryRunner} from "typeorm";

export class UserOwnerIdNullableInAppToken1644494387696 implements MigrationInterface {
    name = 'UserOwnerIdNullableInAppToken1644494387696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_token" DROP CONSTRAINT "FK_22bff875518ec7bec98ab3f557a"`);
        await queryRunner.query(`ALTER TABLE "application_token" ALTER COLUMN "owner_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_token" ADD CONSTRAINT "FK_22bff875518ec7bec98ab3f557a" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "application_token" DROP CONSTRAINT "FK_22bff875518ec7bec98ab3f557a"`);
        await queryRunner.query(`ALTER TABLE "application_token" ALTER COLUMN "owner_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "application_token" ADD CONSTRAINT "FK_22bff875518ec7bec98ab3f557a" FOREIGN KEY ("owner_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
