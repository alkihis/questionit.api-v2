import {MigrationInterface, QueryRunner} from "typeorm";

export class MakeAppTokenRelationNullable1644178484894 implements MigrationInterface {
    name = 'MakeAppTokenRelationNullable1644178484894'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_1e87823e138fed9832239123ef8"`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "app_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "token" ADD CONSTRAINT "FK_1e87823e138fed9832239123ef8" FOREIGN KEY ("app_id") REFERENCES "questionit_application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "token" DROP CONSTRAINT "FK_1e87823e138fed9832239123ef8"`);
        await queryRunner.query(`ALTER TABLE "token" ALTER COLUMN "app_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "token" ADD CONSTRAINT "FK_1e87823e138fed9832239123ef8" FOREIGN KEY ("app_id") REFERENCES "questionit_application"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
