import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import * as bootstrap from 'bootstrap';
import './assets/style.css';

const API_BASE = import.meta.env.VITE_BASE_URL;
const API_PATH = import.meta.env.VITE_API_PATH;

const INITIAL_TEMPLATE_DATA = {
  id: '',
  title: '',
  category: '',
  origin_price: '',
  price: '',
  unit: '',
  description: '',
  content: '',
  is_enabled: false,
  imageUrl: '',
  imagesUrl: [],
}

function App() {
  // 表單狀態
  const [formData, setFromData] = useState({
    username: 'leotimjack@gmail.com',
    password: ''
  });
  // 登入狀態管理
  const [isAuth, setIsAuth] = useState(false);
  // 產品列表
  const [products, setProducts] = useState([]);
  
  const [templateProduct, setTemplateProduct] = useState(INITIAL_TEMPLATE_DATA);
  const [modalType, setModalType] = useState('');

  const productModalRef = useRef(null);

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setFromData((preData) => ({
      ...preData,
      [name]: value,
    }))
  };

  const handleModalInputChange = (e) => {
    const { name, value, checked, type } = e.target
    setTemplateProduct((preData) => ({
      ...preData,
      [name]: type === 'checkbox' ? checked : value,
    }))
  };

  const handleModalImageChange = (index, value) => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage[index] = value;
      return {...pre, imagesUrl: newImage}
    })
  };

  const handleAddImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl, ''];
      return {...pre, imagesUrl: newImage}
    })
  };

  const handleRemoveImage = () => {
    setTemplateProduct((pre) => {
      const newImage = [...pre.imagesUrl];
      newImage.pop();
      return {...pre, imagesUrl: newImage}
    })
  };

  const handleDeleteProduct = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE}/api/${API_PATH}/admin/product/${id}`)
      alert('刪除產品成功', res)
      getProducts();
      closeModal();
    } catch (error) {
      console.log(error.response);
    }
  }

  const getProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/v2/api/${API_PATH}/admin/products`)
      setProducts(res.data.products)
      console.log('取得品列表成功')
    } catch (error) {
      console.error('取得產品列表異常:', error.response)
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      console.log('登入確認中...')
      const res = await axios.post(`${API_BASE}/v2/admin/signin`, formData)
      const { token, expired } = res.data;
      document.cookie = `hexToken=${token};expired=${new Date(expired)};`;
      axios.defaults.headers.common['Authorization'] = token;

      getProducts();
      setIsAuth(true);
    } catch (error) {
      setIsAuth(false)
      console.error('登入錯誤：', error.response);
    }
  };

  const updateProduct = async (id) => {
    let url = `${API_BASE}/api/${API_PATH}/admin/product`;
    let method = 'post';

    if (modalType !== 'edit') {
      url = `${API_BASE}/api/${API_PATH}/admin/product/${id}`;
      method = 'put';
    };

    const product = {
      data: {
        ...templateProduct,
        origin_price: Number(templateProduct.origin_price),
        price: Number(templateProduct.price),
        is_enabled: templateProduct.is_enabled ? 1 : 0,
        imagesUrl: [...templateProduct.imagesUrl.filter((url) => url !== '')]
      }
    };

    try {
      const res = await axios[method](url, product)
      console.log(res);
      getProducts();
      closeModal();
    } catch (error) {
      console.error(error.response);
    }
  }
  
  useEffect(() => {
    const token = document.cookie
    .split("; ")
    .find((row) => row.startsWith("hexToken="))
    ?.split("=")[1];
    if (token) {
      axios.defaults.headers.common['Authorization'] = token;
    };
    
    productModalRef.current = new bootstrap.Modal("#productModal", {
      keyboard: false,
    })

    document
      .querySelector("#productModal")
      .addEventListener("hide.bs.modal", () => {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
      });

    const checkLogin = async () => {
      try {
        const res = await axios.post(`${API_BASE}/v2/api/user/check`)
        console.log(res.data)
        setIsAuth(true);
        getProducts();
      } catch (error) {
        console.error(error)
      }
    };

    checkLogin();
  },[])

  const openModal = (type, product) => {
    setModalType(type);
    setTemplateProduct((pre) => ({
      ...pre,
      ...product
    }))
    productModalRef.current.show()
  }

  const closeModal = () => {
    setTemplateProduct(INITIAL_TEMPLATE_DATA);
    productModalRef.current.hide()
  }

  return (
    <>
      {!isAuth ?
        (<div className="container login">
          <h1>請先登入</h1>
          <form className="form-floating" onSubmit={handleSubmit}>
            <div className="form-floating mb-2">
              <input
                type="email"
                className="form-control"
                name="username"
                placeholder="username@gmail.com"
                value={FormData.username}
                onChange={handleFormChange}
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                name="password"
                placeholder="Password"
                value={FormData.password}
                onChange={handleFormChange}
              />
              <label htmlFor="password">Password</label>
            </div>
            <button
              type="submit"
              className="btn btn-success w-100 mt-3"
            >
              Login
            </button>
          </form>
        </div>) : (
          <div className="container">
            {/* 功能按鈕 */}
            <h2>產品列表</h2>
            <div className="text-end mt-4">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => openModal('create', INITIAL_TEMPLATE_DATA)}
              >
                建立新的產品
              </button>
            </div>
            <table className='table'>
                  <thead>
                    <tr>
                      <th>分類</th>
                      <th>產品名稱</th>
                      <th>原價</th>
                      <th>售價</th>
                      <th>是否啟用</th>
                      <th>編輯</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 將 product 逐一渲染到畫面上 */}
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.category}</td>
                        <td>{product.title}</td>
                        <td>{product.origin_price}</td>
                        <td>{product.price}</td>
                        <td className={product.is_enabled ? "text-success" : "text-secondary"}>{product.is_enabled ? '啟用' : '未啟用'}</td>
                        <td>
                          <div className="btn-group btn-group-sm" role="group" aria-label="Basic example">
                            <button
                              type="button"
                              className="btn btn-outline-dark"
                              onClick={() => openModal('create', product)}
                            >編輯</button>
                            <button
                              type="button"
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteProduct(product.id)}
                            >刪除</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
            </table>
          </div>
        )}
        <div
          id="productModal"
          className="modal fade"
          tabIndex="-1"
          aria-labelledby="productModalLabel"
          aria-hidden="true"
          ref={productModalRef}
          >
          <div className="modal-dialog modal-xl">
            <div className="modal-content border-0">
              <div className="modal-header bg-dark text-white">
                <h5 id="productModalLabel" className="modal-title">
                  <span>新增產品</span>
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                  ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-sm-4">
                    <div className="mb-2">
                      <div className="mb-3">
                        <label htmlFor="imageUrl" className="form-label">
                          輸入圖片網址
                        </label>
                        <input
                          type="text"
                          id="imageUrl"
                          name="imageUrl"
                          className="form-control"
                          placeholder="請輸入圖片連結"
                          value={templateProduct.imageUrl}
                          onChange={handleModalInputChange}
                          />
                      </div>
                      { templateProduct.imageUrl && 
                        <img className="img-fluid" src={templateProduct.imageUrl} alt="主圖" />
                      }
                    </div>
                    <div>
                      { templateProduct.imagesUrl.map((url, index) => (
                        <div key={index}>
                          <label htmlFor="imageUrl" className="form-label">
                            輸入圖片網址
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder={`圖片網址${index + 1}`}
                            value={url}
                            onChange={(e) => handleModalImageChange(index, e.target.value)}
                          />
                          { url && 
                            <img
                              className="img-fluid"
                              src={url}
                              alt={`副圖${index + 1}`}
                            />
                          }
                        </div>
                      ))}
                      { templateProduct.imagesUrl.length < 5 &&
                        templateProduct.imagesUrl[templateProduct.imagesUrl.length - 1] !== '' &&
                        <button className="btn btn-outline-success btn-sm d-block w-100"
                          onClick={handleAddImage}
                        >
                          新增圖片
                        </button>
                      }
                    </div>
                    <div>
                      { templateProduct.imagesUrl.length >1 &&
                        <button className="btn btn-outline-danger btn-sm d-block w-100 mt-2"
                          onClick={handleRemoveImage}
                        >
                          刪除圖片
                        </button>                      
                      }
                    </div>
                  </div>
                  <div className="col-sm-8">
                    <div className="mb-3">
                      <label htmlFor="title" className="form-label">標題</label>
                      <input
                        name="title"
                        id="title"
                        type="text"
                        className="form-control"
                        placeholder="請輸入標題"
                        value={templateProduct.title}
                        onChange={handleModalInputChange}
                        />
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="category" className="form-label">分類</label>
                        <input
                          name="category"
                          id="category"
                          type="text"
                          className="form-control"
                          placeholder="請輸入分類"
                          value={templateProduct.category}
                          onChange={handleModalInputChange}
                          />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="unit" className="form-label">單位</label>
                        <input
                          name="unit"
                          id="unit"
                          type="text"
                          className="form-control"
                          placeholder="請輸入單位"
                          value={templateProduct.unit}
                          onChange={handleModalInputChange}
                          />
                      </div>
                    </div>

                    <div className="row">
                      <div className="mb-3 col-md-6">
                        <label htmlFor="origin_price" className="form-label">原價</label>
                        <input
                          name="origin_price"
                          id="origin_price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入原價"
                          value={templateProduct.origin_price}
                          onChange={handleModalInputChange}
                          />
                      </div>
                      <div className="mb-3 col-md-6">
                        <label htmlFor="price" className="form-label">售價</label>
                        <input
                          name="price"
                          id="price"
                          type="number"
                          min="0"
                          className="form-control"
                          placeholder="請輸入售價"
                          value={templateProduct.price}
                          onChange={handleModalInputChange}
                          />
                      </div>
                    </div>
                    <hr />

                    <div className="mb-3">
                      <label htmlFor="description" className="form-label">產品描述</label>
                      <textarea
                        name="description"
                        id="description"
                        className="form-control"
                        placeholder="請輸入產品描述"
                        value={templateProduct.description}
                        onChange={handleModalInputChange}
                        ></textarea>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="content" className="form-label">說明內容</label>
                      <textarea
                        name="content"
                        id="content"
                        className="form-control"
                        placeholder="請輸入說明內容"
                        value={templateProduct.content}
                        onChange={handleModalInputChange}
                        ></textarea>
                    </div>
                    <div className="mb-3">
                      <div className="form-check">
                        <input
                          name="is_enabled"
                          id="is_enabled"
                          className="form-check-input"
                          type="checkbox"
                          checked={templateProduct.is_enabled}
                          onChange={handleModalInputChange}
                          />
                        <label className="form-check-label" htmlFor="is_enabled">
                          是否啟用
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  data-bs-dismiss="modal"
                  onClick={() => closeModal()}
                  >
                  取消
                </button>
                <button type="button" className="btn btn-success" onClick={() => updateProduct(templateProduct.id)}>確認</button>
              </div>
            </div>
          </div>
        </div>
    </>
  )
};

export default App
