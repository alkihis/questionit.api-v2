import {MigrationInterface, QueryRunner} from "typeorm";

export class MakeQuestionOfTheDayPresentsInDb1643993394258 implements MigrationInterface {
    name = 'MakeQuestionOfTheDayPresentsInDb1643993394258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" RENAME COLUMN "question_of_the_day" TO "question_of_the_day_id"`);
        await queryRunner.query(`CREATE TABLE "day_question" ("id" SERIAL NOT NULL, "content" jsonb NOT NULL, "hidden" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_a576588f0712fe80f0afd6d6e05" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "question_of_the_day_id"`);
        await queryRunner.query(`ALTER TABLE "question" ADD "question_of_the_day_id" integer`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_3d2e34ca12f3e46d5a181c36ee2" FOREIGN KEY ("question_of_the_day_id") REFERENCES "day_question"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_3d2e34ca12f3e46d5a181c36ee2"`);
        await queryRunner.query(`ALTER TABLE "question" DROP COLUMN "question_of_the_day_id"`);
        await queryRunner.query(`ALTER TABLE "question" ADD "question_of_the_day_id" text`);
        await queryRunner.query(`DROP TABLE "day_question"`);
        await queryRunner.query(`ALTER TABLE "question" RENAME COLUMN "question_of_the_day_id" TO "question_of_the_day"`);
    }

}
