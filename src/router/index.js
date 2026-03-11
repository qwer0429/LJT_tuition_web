import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import Layout from '@/layout'

export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    component: Layout,
    redirect: '/student',
    children: [{
      path: 'student',
      name: 'Student',
      component: () => import('@/views/student/index'),
      meta: { title: '学生管理', icon: 'el-icon-user' }
    }]
  },

  {
    path: '/student-tuition',
    component: Layout,
    children: [{
      path: 'index',
      name: 'StudentTuition',
      component: () => import('@/views/studentTuition/index'),
      meta: { title: '学生学费信息', icon: 'el-icon-s-finance' }
    }]
  },

  {
    path: '/tuition-config',
    component: Layout,
    redirect: '/tuition-config/grade',
    meta: { title: '学费配置', icon: 'el-icon-setting' },
    children: [
      {
        path: 'grade',
        name: 'GradeConfig',
        component: () => import('@/views/tuitionConfig/grade'),
        meta: { title: '年级学费配置' }
      },
      {
        path: 'semester',
        name: 'SemesterConfig',
        component: () => import('@/views/tuitionConfig/semester'),
        meta: { title: '学期配置' }
      },
      {
        path: 'calculation',
        name: 'CalculationConfig',
        component: () => import('@/views/tuitionConfig/calculation'),
        meta: { title: '计算规则' }
      },
      {
        path: 'calendar',
        name: 'SchoolCalendar',
        component: () => import('@/views/tuitionConfig/calendar'),
        meta: { title: '校历' }
      }
    ]
  },

  {
    path: '/tuition-calculation',
    component: Layout,
    children: [{
      path: 'index',
      name: 'TuitionCalculation',
      component: () => import('@/views/tuitionConfig/calculationResult'),
      meta: { title: '学费计算', icon: 'el-icon-s-order' }
    }]
  },

  { path: '*', redirect: '/404', hidden: true }
]

const createRouter = () => new Router({
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes
})

const router = createRouter()

export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher
}

export default router
