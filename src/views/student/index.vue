<template>
  <div class="app-container">
    <!-- 搜索栏 -->
    <el-card class="filter-container" shadow="never">
      <div style="overflow: hidden;">
        <el-form :inline="true" :model="listQuery" class="demo-form-inline">
          <el-form-item label="年级：">
            <el-select v-model="listQuery.class_name" placeholder="请选择年级" clearable filterable style="width: 200px;">
              <el-option
                v-for="item in classOptions"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="英文名：">
            <el-input v-model="listQuery.english_name" placeholder="请输入英文名" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item label="学号：">
            <el-input v-model="listQuery.student_no" placeholder="请输入学号" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 操作栏 -->
    <el-card class="operate-container" shadow="never" style="margin-top: 15px;">
      <div class="table-operation">
        <el-button type="success" icon="el-icon-upload2" @click="handleImport">批量导入</el-button>
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增学生</el-button>
        <el-button type="warning" icon="el-icon-download" @click="handleExportTemplate">下载导入模板</el-button>
      </div>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-container" shadow="never" style="margin-top: 15px;">
      <el-table
        v-loading="listLoading"
        :data="list"
        element-loading-text="加载中..."
        border
        fit
        highlight-current-row
        style="width: 100%;"
        :max-height="tableHeight"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="年级" prop="class_name" align="center" min-width="120" />
        <el-table-column label="学号" prop="student_no" align="center" min-width="120" />
        <el-table-column label="姓" prop="last_name" align="center" min-width="100" />
        <el-table-column label="名" prop="first_name" align="center" min-width="100" />
        <el-table-column label="英文名" prop="english_name" align="center" min-width="130" />
        <el-table-column label="性别" prop="gender" align="center" width="80">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.gender === 'Male'" type="primary" size="small">男</el-tag>
            <el-tag v-else-if="scope.row.gender === 'Female'" type="danger" size="small">女</el-tag>
            <span v-else>{{ scope.row.gender }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出生日期" prop="dob" align="center" min-width="120" />
        <el-table-column label="家长1邮箱" prop="parent1_email_address" align="center" min-width="180" show-overflow-tooltip />
        <el-table-column label="家长2邮箱" prop="parent2_email_address" align="center" min-width="180" show-overflow-tooltip />
        <el-table-column label="操作" align="center" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="text" size="small" style="color: #f56c6c;" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态提示 -->
      <div v-if="!listLoading && list.length === 0" style="text-align: center; padding: 40px 0;">
        <i class="el-icon-warning-outline" style="font-size: 48px; color: #909399;" />
        <p style="color: #909399; margin-top: 10px;">暂无学生数据</p>
        <p style="color: #c0c4cc; font-size: 12px;">请点击"新增学生"或"批量导入"按钮添加</p>
      </div>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-container" style="margin-top: 20px; text-align: right;">
        <el-pagination
          background
          :current-page="listQuery.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="listQuery.page_size"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 导入对话框 -->
    <el-dialog title="批量导入学生" :visible.sync="importDialogVisible" width="500px">
      <el-upload
        ref="upload"
        class="upload-demo"
        drag
        action="/sljt/masterlist_excel/"
        :headers="uploadHeaders"
        :on-success="handleUploadSuccess"
        :on-error="handleUploadError"
        accept=".xlsx,.xls"
        :auto-upload="true"
      >
        <i class="el-icon-upload" />
        <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
        <div slot="tip" class="el-upload__tip">只能上传 Excel 文件，且不超过 10MB</div>
      </el-upload>
      <div slot="footer" class="dialog-footer">
        <el-button @click="importDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>

    <!-- 编辑/新增对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogVisible" width="800px">
      <el-form ref="studentForm" :model="studentForm" :rules="rules" label-width="120px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="年级" prop="class_name">
              <el-input v-model="studentForm.class_name" placeholder="请输入年级" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="学号" prop="student_no">
              <el-input v-model="studentForm.student_no" placeholder="请输入学号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="姓" prop="last_name">
              <el-input v-model="studentForm.last_name" placeholder="请输入姓" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="名" prop="first_name">
              <el-input v-model="studentForm.first_name" placeholder="请输入名" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="英文名" prop="english_name">
              <el-input v-model="studentForm.english_name" placeholder="请输入英文名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="性别" prop="gender">
              <el-select v-model="studentForm.gender" placeholder="请选择性别" style="width: 100%;">
                <el-option label="男" value="Male" />
                <el-option label="女" value="Female" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出生日期" prop="dob">
              <el-date-picker v-model="studentForm.dob" type="date" placeholder="选择日期" style="width: 100%;" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="国籍" prop="nationality">
              <el-input v-model="studentForm.nationality" placeholder="请输入国籍" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="家长1姓名" prop="parent1_name">
              <el-input v-model="studentForm.parent1_name" placeholder="请输入家长1姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="家长1邮箱" prop="parent1_email_address">
              <el-input v-model="studentForm.parent1_email_address" placeholder="请输入家长1邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="家长2姓名" prop="parent2_name">
              <el-input v-model="studentForm.parent2_name" placeholder="请输入家长2姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="家长2邮箱" prop="parent2_email_address">
              <el-input v-model="studentForm.parent2_email_address" placeholder="请输入家长2邮箱" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getToken } from '@/utils/auth'

export default {
  name: 'StudentManage',
  data() {
    return {
      list: [],
      total: 0,
      listLoading: false,
      tableHeight: window.innerHeight - 350,
      classOptions: [],
      listQuery: {
        page: 1,
        page_size: 20,
        class_name: '',
        english_name: '',
        student_no: ''
      },
      importDialogVisible: false,
      uploadHeaders: {
        'Authorization': 'Bearer ' + getToken()
      },
      dialogVisible: false,
      dialogTitle: '',
      isEdit: false,
      studentForm: {
        id: null,
        class_name: '',
        student_no: '',
        last_name: '',
        first_name: '',
        english_name: '',
        gender: '',
        dob: '',
        nationality: '',
        parent1_name: '',
        parent1_email_address: '',
        parent2_name: '',
        parent2_email_address: ''
      },
      rules: {
        class_name: [{ required: true, message: '请输入年级', trigger: 'blur' }],
        student_no: [{ required: true, message: '请输入学号', trigger: 'blur' }],
        last_name: [{ required: true, message: '请输入姓', trigger: 'blur' }],
        first_name: [{ required: true, message: '请输入名', trigger: 'blur' }],
        english_name: [{ required: true, message: '请输入英文名', trigger: 'blur' }]
      }
    }
  },
  created() {
    this.getList()
    this.getClassOptions()
  },
  mounted() {
    window.addEventListener('resize', () => {
      this.tableHeight = window.innerHeight - 350
    })
  },
  methods: {
    // 获取列表数据 - 支持多种返回格式
    async getList() {
      this.listLoading = true
      try {
        const params = {}
        if (this.listQuery.class_name) params.class_name = this.listQuery.class_name
        if (this.listQuery.english_name) params.english_name = this.listQuery.english_name
        if (this.listQuery.student_no) params.student_no = this.listQuery.student_no
        params.page = this.listQuery.page
        params.page_size = this.listQuery.page_size

        const res = await this.$http.get('/students/', { params })
        console.log('学生列表返回数据:', res)
        
        // 处理不同可能的返回格式
        let dataList = []
        let totalCount = 0
        
        if (Array.isArray(res)) {
          // 直接返回数组
          dataList = res
          totalCount = res.length
        } else if (res.results && Array.isArray(res.results)) {
          // DRF 分页格式
          dataList = res.results
          totalCount = res.count || res.results.length
        } else if (res.data && Array.isArray(res.data)) {
          // 包装在 data 字段中
          dataList = res.data
          totalCount = res.total || res.data.length
        } else if (typeof res === 'object' && res !== null) {
          // 可能是对象形式
          if (res.id) {
            dataList = [res]
            totalCount = 1
          }
        }
        
        this.list = dataList
        this.total = totalCount
        
        if (dataList.length === 0) {
          this.$message.info('暂无学生数据')
        }
      } catch (error) {
        console.error('获取学生列表失败:', error)
        this.$message.error('获取学生列表失败: ' + (error.message || '网络错误'))
        this.list = []
        this.total = 0
      } finally {
        this.listLoading = false
      }
    },
    
    // 获取年级选项
    async getClassOptions() {
      try {
        const res = await this.$http.get('/get_all_class_and_student/')
        console.log('年级选项返回数据:', res)
        this.classOptions = res.class_name || []
      } catch (error) {
        console.error('获取年级列表失败:', error)
        this.classOptions = []
      }
    },
    
    handleSearch() {
      this.listQuery.page = 1
      this.getList()
    },
    handleReset() {
      this.listQuery = {
        page: 1,
        page_size: 20,
        class_name: '',
        english_name: '',
        student_no: ''
      }
      this.getList()
    },
    handleSizeChange(val) {
      this.listQuery.page = 1
      this.listQuery.page_size = val
      this.getList()
    },
    handleCurrentChange(val) {
      this.listQuery.page = val
      this.getList()
    },
    handleImport() {
      this.importDialogVisible = true
    },
    handleUploadSuccess(response) {
      this.$message.success('导入成功')
      this.importDialogVisible = false
      this.getList()
    },
    handleUploadError(error) {
      this.$message.error('导入失败: ' + (error.message || '未知错误'))
    },
    handleExportTemplate() {
      this.$message.info('模板下载功能开发中...')
    },
    handleAdd() {
      this.isEdit = false
      this.dialogTitle = '新增学生'
      this.studentForm = {
        id: null,
        class_name: '',
        student_no: '',
        last_name: '',
        first_name: '',
        english_name: '',
        gender: '',
        dob: '',
        nationality: '',
        parent1_name: '',
        parent1_email_address: '',
        parent2_name: '',
        parent2_email_address: ''
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.studentForm && this.$refs.studentForm.clearValidate()
      })
    },
    handleEdit(row) {
      this.isEdit = true
      this.dialogTitle = '编辑学生'
      this.studentForm = { ...row }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.studentForm && this.$refs.studentForm.clearValidate()
      })
    },
    async handleDelete(row) {
      try {
        await this.$confirm(`确认删除学生 "${row.english_name}"?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        await this.$http.delete(`/students/${row.id}/`)
        this.$message.success('删除成功')
        this.getList()
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
      }
    },
    async handleSubmit() {
      this.$refs.studentForm.validate(async(valid) => {
        if (valid) {
          try {
            if (this.isEdit) {
              await this.$http.put(`/students/${this.studentForm.id}/`, this.studentForm)
              this.$message.success('更新成功')
            } else {
              await this.$http.post('/students/', this.studentForm)
              this.$message.success('新增成功')
            }
            this.dialogVisible = false
            this.getList()
          } catch (error) {
            this.$message.error(this.isEdit ? '更新失败' : '新增失败')
          }
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.filter-container {
  .el-form-item {
    margin-bottom: 10px;
  }
}
</style>
