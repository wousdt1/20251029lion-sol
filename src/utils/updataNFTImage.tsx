import axios from "axios";
import type { TOKEN_TYPE } from '../type'

let BASE_URL = 'https://upload.uploadmags.top'
// let BASE_URL = 'http://localhost:8000'

export const upLoadImage = (data: TOKEN_TYPE, selectedFile: File | string, isFile: boolean) => {
  return new Promise(async (resolve: (value: string) => void, reject) => {
    try {

      const formdata1 = new FormData();
      let imagUrl = ''
      if (isFile) {
        formdata1.append("logo", selectedFile);

        const requestOptions = {
          method: "POST",
          body: formdata1,
        };
        const res = await fetch(`${BASE_URL}/uploadimg`, requestOptions)
        const resData = await res.text();
        imagUrl = resData
      } else {
        // formdata.append("image", selectedFile);
        // BASE_URL = `${BASE_URL}s`
        imagUrl = selectedFile as string
      }

      const formdata = new FormData();

      const dataF = {
        name: data.name,
        symbol: data.symbol,
        description: data.description,
        image: imagUrl,
        extensions: {
          website: data.website,
          telegram: data.telegram,
          twitter: data.twitter,
          discord: data.discord,
        }
      }

      const jsonString = JSON.stringify(dataF, null, 2);

      // 2. 创建 JSON 文件
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], "metadata.json", { type: "application/json" });
      formdata.append("file", file);

      const requestOptions = {
        method: "POST",
        body: formdata,
      };
      const res = await fetch(`${BASE_URL}/file`, requestOptions)
      const resData = await res.text();
      //将NFT数据转化成JSON格式存储到变量中
      resolve(resData)

      // formdata.append("name", data.name);
      // formdata.append("symbol", data.symbol);
      // formdata.append("description", data.description);

      // if (data.website) {
      //   formdata.append("website", data.website);
      // }
      // if (data.telegram) {
      //   formdata.append("telegram", data.telegram);
      // }
      // if (data.twitter) {
      //   formdata.append("twitter", data.twitter);
      // }
      // if (data.discord) {
      //   formdata.append("discord", data.discord);
      // }
      // const requestOptions = {
      //   method: "POST",
      //   body: formdata,
      // };
      // const res = await fetch(BASE_URL, requestOptions)
      // const resData = await res.text();
      // //将NFT数据转化成JSON格式存储到变量中
      // resolve(resData)
    } catch (error) {
      reject(error)
    }
  })
}



