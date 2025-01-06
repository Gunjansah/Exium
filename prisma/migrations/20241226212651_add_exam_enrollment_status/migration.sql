-- CreateEnum
CREATE TYPE "ExamEnrollmentStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SUBMITTED');

-- AlterTable
ALTER TABLE "exam_enrollments" ADD COLUMN     "endTime" TIMESTAMP(3),
ADD COLUMN     "startTime" TIMESTAMP(3),
ADD COLUMN     "status" "ExamEnrollmentStatus" NOT NULL DEFAULT 'NOT_STARTED';
