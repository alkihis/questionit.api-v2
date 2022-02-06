import {MigrationInterface, QueryRunner} from "typeorm";

export class MakeQuestionReplyOptional1643970373167 implements MigrationInterface {
    name = 'MakeQuestionReplyOptional1643970373167'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_de721431aab51f969eaa84845d1"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "in_reply_to_question_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_de721431aab51f969eaa84845d1" FOREIGN KEY ("in_reply_to_question_id") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "question" DROP CONSTRAINT "FK_de721431aab51f969eaa84845d1"`);
        await queryRunner.query(`ALTER TABLE "question" ALTER COLUMN "in_reply_to_question_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "question" ADD CONSTRAINT "FK_de721431aab51f969eaa84845d1" FOREIGN KEY ("in_reply_to_question_id") REFERENCES "question"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
