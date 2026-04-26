<template>
  <div class="app-container">
    <!-- 配置选择 -->
    <el-card shadow="never" style="margin-bottom: 15px;">
      <div slot="header" class="clearfix">
        <span>选择配置</span>
      </div>
      <el-row :gutter="20">
        <el-col :span="16">
          <el-select v-model="selectedConfigId" placeholder="请选择配置" style="width: 100%;" @change="handleConfigChange">
            <el-option
              v-for="item in configList"
              :key="item.id"
              :label="(item.academic_year || '未命名') + (item.is_active ? ' - 启用' : ' - 禁用')"
              :value="item.id"
            />
          </el-select>
        </el-col>
        <el-col :span="8" style="text-align: right;">
          <el-button type="success" icon="el-icon-plus" @click="handleNewConfig">新建配置</el-button>
          <el-button type="primary" icon="el-icon-check" @click="handleSave">保存配置</el-button>
        </el-col>
      </el-row>
    </el-card>

    <el-card shadow="never">
      <div slot="header" class="clearfix">
        <span>学费计算全局配置</span>
        <el-tag v-if="configId" type="success" style="margin-left: 10px;">编辑模式</el-tag>
        <el-tag v-else type="warning" style="margin-left: 10px;">新建模式</el-tag>
      </div>
      <el-form ref="configForm" :model="configForm" label-width="180px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="学年" prop="academic_year">
              <el-input v-model="configForm.academic_year" placeholder="如：2025-2026" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="启用状态">
              <el-switch v-model="configForm.is_active" active-text="启用" inactive-text="禁用" />
            </el-form-item>
          </el-col>
        </el-row>



        <el-divider content-position="left">折扣配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="第二个孩子折扣(%)">
              <el-input-number v-model="configForm.sibling_discount_2nd" :min="0" :max="100" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="第三个及以后折扣(%)">
              <el-input-number v-model="configForm.sibling_discount_3rd" :min="0" :max="100" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="公司折扣(%)">
              <el-input-number v-model="configForm.company_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="校友兄弟姐妹折扣(%)">
              <el-input-number v-model="configForm.alumni_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="教师子弟折扣(%)">
              <el-input-number v-model="configForm.teacher_discount_rate" :min="0" :max="100" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="公司人数阈值">
              <el-input-number v-model="configForm.company_person_num" :min="1" :precision="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">校车费用</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="校车全年费用">
              <el-input-number v-model="configForm.bus_annual_payment" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="第一学期费用">
              <el-input-number v-model="configForm.bus_semester_1_payment" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="第二学期费用">
              <el-input-number v-model="configForm.bus_semester_2_payment" :min="0" :precision="2" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">时间配置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="付款截止日期">
              <el-date-picker v-model="configForm.payment_deadline" type="date" placeholder="选择日期" style="width: 100%;" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学年开始日期">
              <el-date-picker v-model="configForm.start_date" type="date" placeholder="选择日期" style="width: 100%;" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学年结束日期">
              <el-date-picker v-model="configForm.end_date" type="date" placeholder="选择日期" style="width: 100%;" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script>
export default {
  name: 'CalculationConfig',
  data() {
    return {
      configList: [],
      selectedConfigId: null,
      configForm: {
        academic_year: '2025-2026',
        is_active: true,
        sibling_discount_2nd: 5,
        sibling_discount_3rd: 10,
        company_discount_rate: 5,
        alumni_discount_rate: 5,
        teacher_discount_rate: 10,
        company_person_num: 70,
        bus_annual_payment: 11000,
        bus_semester_1_payment: 5900,
        bus_semester_2_payment: 5100,
        payment_deadline: '2025-05-01',
        start_date: '2025-08-18',
        end_date: '2026-06-19',
        semester_days: ''
      },
      configId: null
    }
  },
  created() {
    this.getConfigList()
  },
  methods: {
    // 获取配置列表
    async getConfigList() {
      try {
        const res = await this.$http.get('/tuitioncalculationconfig/')
        let configs = []
        
        if (Array.isArray(res)) {
          configs = res
        } else if (res.results && Array.isArray(res.results)) {
          configs = res.results
        } else if (res.data && Array.isArray(res.data)) {
          configs = res.data
        }
        
        this.configList = configs
        
        // 如果有启用的配置，默认选中第一个启用的
        const activeConfig = configs.find(c => c.is_active)
        if (activeConfig) {
          this.selectedConfigId = activeConfig.id
          this.loadConfig(activeConfig)
        } else if (configs.length > 0) {
          this.selectedConfigId = configs[0].id
          this.loadConfig(configs[0])
        }
      } catch (error) {
        console.error('获取配置列表失败:', error)
        this.$message.error('获取配置列表失败')
      }
    },
    
    // 加载指定配置到表单
    loadConfig(config) {
      if (!config) return
      
      this.configId = config.id
      this.configForm = {
        name: config.academic_year || '默认配置',
        academic_year: config.academic_year || '2025-2026',
        is_active: config.is_active !== false,
        sibling_discount_2nd: config.sibling_discount_2nd || 5,
        sibling_discount_3rd: config.sibling_discount_3rd || 10,
        company_discount_rate: config.company_discount_rate || 5,
        alumni_discount_rate: config.alumni_discount_rate || 5,
        teacher_discount_rate: config.teacher_discount_rate || 10,
        company_person_num: config.company_person_num || 70,
        bus_annual_payment: config.bus_annual_payment || 11000,
        bus_semester_1_payment: config.bus_semester_1_payment || 5900,
        bus_semester_2_payment: config.bus_semester_2_payment || 5100,
        payment_deadline: config.payment_deadline || '2025-05-01',
        start_date: config.start_date || '2025-08-18',
        end_date: config.end_date || '2026-06-19',
        semester_days: config.semester_days || ''
      }
    },
    
    // 切换配置
    handleConfigChange(configId) {
      const config = this.configList.find(c => c.id === configId)
      if (config) {
        this.loadConfig(config)
        this.$message.success(`已切换到: ${config.academic_year}`)
      }
    },
    
    // 新建配置
    handleNewConfig() {
      this.configId = null
      this.selectedConfigId = null
      this.configForm = {
        name: '',
        academic_year: '2025-2026',
        is_active: true,
        sibling_discount_2nd: 5,
        sibling_discount_3rd: 10,
        company_discount_rate: 5,
        alumni_discount_rate: 5,
        teacher_discount_rate: 10,
        company_person_num: 70,
        bus_annual_payment: 11000,
        bus_semester_1_payment: 5900,
        bus_semester_2_payment: 5100,
        payment_deadline: '2025-05-01',
        start_date: '2025-08-18',
        end_date: '2026-06-19',
        semester_days: ''
      }
      this.$message.info('已创建新配置，请修改后保存')
    },
    
    // 保存配置
    async handleSave() {
      try {
        // 确保数值类型正确
        const submitData = {
          name: this.configForm.academic_year,
          academic_year: this.configForm.academic_year,
          is_active: this.configForm.is_active,
          sibling_discount_2nd: parseFloat(this.configForm.sibling_discount_2nd) || 0,
          sibling_discount_3rd: parseFloat(this.configForm.sibling_discount_3rd) || 0,
          company_discount_rate: parseFloat(this.configForm.company_discount_rate) || 0,
          alumni_discount_rate: parseFloat(this.configForm.alumni_discount_rate) || 0,
          teacher_discount_rate: parseFloat(this.configForm.teacher_discount_rate) || 0,
          company_person_num: parseInt(this.configForm.company_person_num) || 70,
          bus_annual_payment: parseFloat(this.configForm.bus_annual_payment) || 0,
          bus_semester_1_payment: parseFloat(this.configForm.bus_semester_1_payment) || 0,
          bus_semester_2_payment: parseFloat(this.configForm.bus_semester_2_payment) || 0,
          payment_deadline: this.configForm.payment_deadline,
          start_date: this.configForm.start_date,
          end_date: this.configForm.end_date
        }
        
        if (this.configId) {
          await this.$http.put(`/tuitioncalculationconfig/${this.configId}/`, submitData)
          this.$message.success('保存成功')
        } else {
          const res = await this.$http.post('/tuitioncalculationconfig/', submitData)
          if (res && res.id) {
            this.configId = res.id
            this.selectedConfigId = res.id
          }
          this.$message.success('创建成功')
        }
        
        // 刷新配置列表
        await this.getConfigList()
      } catch (error) {
        console.error('保存失败:', error)
        this.$message.error('保存失败: ' + (error.message || '网络错误'))
      }
    }
  }
}
</script>
