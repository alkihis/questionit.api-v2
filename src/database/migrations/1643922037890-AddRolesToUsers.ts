import {MigrationInterface, QueryRunner} from "typeorm";

export class AddRolesToUsers1643922037890 implements MigrationInterface {
    name = 'AddRolesToUsers1643922037890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."e_user_roles" AS ENUM('admin', 'user')`);
        await queryRunner.query(`ALTER TABLE "user" ADD "role" "public"."e_user_roles" NOT NULL DEFAULT 'user'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."e_user_roles"`);
    }

}
