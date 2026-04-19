import type { Job, JobWithScore, UserConditions } from '../types'
import {
  calcJobScore,
  calcUserFit,
  calcWorkloadFit,
  calcCompatibility,
  calcDifficulty,
  getWhoFitsThis,
  getWhyHardForUser,
} from '../lib/calcCompatibility'

export { calcJobScore, calcUserFit, calcWorkloadFit, calcCompatibility, calcDifficulty, getWhoFitsThis, getWhyHardForUser }

export function buildJobsWithScore(jobs: Job[], conditions: UserConditions): JobWithScore[] {
  return jobs
    .map((job) => ({
      ...job,
      jobScore: calcJobScore(job),
      userFit: calcUserFit(job, conditions),
      workloadFit: calcWorkloadFit(job),
      compatibility: calcCompatibility(job, conditions),
      difficulty: calcDifficulty(job),
      whoFitsThis: getWhoFitsThis(job),
      whyHardReasons: getWhyHardForUser(job, conditions),
    }))
    .sort((a, b) => b.compatibility - a.compatibility)
}
