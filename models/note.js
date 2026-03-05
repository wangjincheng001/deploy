const mongoose = require('mongoose')

require('dotenv').config()

const url = process.env.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url)
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch(error => {
    console.log('error connecting to MongoDB:', error.message)
  })

const phoneValidator = function(v) {
  // 正则表达式解释：
  // ^       : 字符串开始
  // \d{2,3} : 第一部分，必须是2到3个数字
  // -       : 必须包含一个连字符
  // \d+     : 第二部分，必须是数字
  // $       : 字符串结束
  const regex = /^\d{2,3}-\d+$/;
  
  // 检查是否匹配基本格式
  if (!regex.test(v)) {
    return false;
  }

  // 检查长度是否 >= 8
  if (v.length < 8) {
    return false;
  }

  return true;
};



const personSchema = new mongoose.Schema({
  name: {
    type: String,
    minLength: 3,
    required: true,
    unique: true // 内置验证：唯一性
  },
  number: {
    type: String,
    required: [true, '电话号码是必填项'], // 内置验证：必填
    validate: {
      // 使用自定义验证器
      validator: phoneValidator,
      // 验证失败时的错误消息
      message: props => `${props.value} 不是有效的电话号码！格式要求：XX-XXXXXXX 或 XXX-XXXXXX，且总长度至少8位。`
    }
  }
})

personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

const Person = mongoose.model('Person', personSchema)


module.exports = Person
