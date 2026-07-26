<?php
namespace LaraCore\Http\Operations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;

trait  CrudOperations
{

use ApiResponse;
    // private $view_path,$route_path, $data,   $EntityModel  ;
    private $custom_view_edit=false,$custom_view_create=false,
    $custom_view_index=false,$custom_view_show;
private $view_edit="settings::crud.edit";
private $view_create="settings::crud.create";
private $view_show="settings::crud.show";

    public function index()
    {

        $data=$this->data;

        if (request()->bearerToken()) {

            $viewVars = $this->getViewVars('index');


            // $mergedData = array_merge($data, $viewVars);

return $this->success( $viewVars['rows']);
        }


         return view("settings::crud.index",compact('data'),$this->getViewVars('index'));

        // $_this = new self;
        $ntityDataTable  =new  $this->EntityDataTable;


        // $this->getViewVars()
        if(!$this->custom_view_index)

        return $ntityDataTable->render("settings::crud.index",compact('data'),$this->getViewVars('index'))   ;
        return $ntityDataTable->render("$this->view_path.index",compact('data')) ;
    }

    public function create()
    {


        $data=$this->data;

        if (view()->exists("$this->view_path.create")) {
            $view = "$this->view_path.create";
        } else {
            $view = "settings::crud.create";
        }
        $entity=$this->entity;
        // if(!$this->custom_view_create)
        // return view("settings::crud.create"  ,compact('data' ));
        return view($view  ,compact('data','entity' ),$this->getViewVars('create'));
    }


    public function edit(   $id)
    {
        $entity = $this->EntityModel::findOrFail($id);
        $data=$this->data;

        $this-> entity=$entity;
        if(request()->ajax())
        $view="$this->view_path._field";
         else if(!$this->custom_view_edit)
        $view="settings::crud.edit";
        else
        $view="$this->view_path.edit";
        return view($view, compact('entity' ,'data'),$this->getViewVars('edit'));
    }
    public function show($id)
    {
        $data=$this->data;
        $entity =  $this->EntityModel::findOrFail($id);
        $this-> entity=$entity;
        $this->beforeShow($entity);


        if (request()->bearerToken()) {

            $viewVars = $this->getViewVars('show');


            // $mergedData = array_merge($data, $viewVars);

return $this->success( $viewVars['entity']);
        }
        if(request()->ajax())
        return view("$this->view_path._show-content"  ,compact('entity' ,'data' ));

        if(!$this->custom_view_show)
        return view("settings::crud.show"  ,compact('entity' ,'data' ),$this->getViewVars('show'));

        return view("$this->view_path.show", compact('entity','data'),$this->getViewVars('show'));
    }


    public function destroy(Request $request,$id)
    {
        $redirect=$request->redirect??null;


        $except_delete=$this->EntityModel::except_delete??[];

try {
        $entity = $this->EntityModel::findOrFail($id);
        // $myRequest = new \Illuminate\Http\Request();
        //   request()->setMethod('GET'); //set the Request method
        //   $request ->setMethod('GET'); //set the Request method




        if(in_array($id,$except_delete)){
            $msg='لايمكن الحذف';
            return redirect()->back() ->withInput() ->withErrors(['error' => $msg]);
        }else{
            $entity->delete();
            $msg='تمت العملية بنجاح';
            if (request()->bearerToken()) {
                return $this->success([ ],$msg);
            }

        }


    }
    catch (\Exception $e){
        if (request()->bearerToken()) {
            return $this->error([], $e->getMessage());
        }
        return redirect()->back() ->withInput() ->withErrors(['error' => $e->getMessage()]);
    }
        // successDelete();

        if (request()->ajax()&&$redirect!='index')
        {


            return response()->json([
                'success' => true,
                'msg' => $msg

            ]);
        }
        successProcess();


        return redirect() ->route("$this->route_name.index");

    }

    public function store( Request $request)
    {

$validate=new $this->data->StoreRequest();


          $request->validate(   $validate->rules()   );
          DB::beginTransaction();


        try {
            $entity= $this->attach($request );
            DB::commit();
            if (request()->bearerToken()) {


                // $mergedData = array_merge($data, $viewVars);

    return $this->success( $entity,__('created_successfully'));
            }
        else if (request()->ajax()) {


			return response([
					'message' => __('created_successfully'),
					'status'  => true,
					'id'      => $entity->id,
				], 200);
		} else
{
    successCreate();
    return redirect()->route("$this->route_name.index");
}


        }
        catch (\Exception $e){
            DB::rollback();
            if (request()->bearerToken()) {

                $m= $e->getMessage();
                // $mergedData = array_merge($data, $viewVars);

    return $this->error([] ,$m);
            }
           else if (request()->ajax()) {

               $m= $e->getMessage();
            // $m=   'An error occurred.';
                return response()->json(['message' =>  $m], 500);
            }
            return redirect()->back()
            ->withInput()
            ->withErrors(['error' => $e->getMessage()]);
        }
    }
    public function update(Request $request, $id)
    {

        $validate=new $this->data->StoreRequest();
        $request->validate(   $validate->rules()   );
        try {

        $entity = $this->EntityModel::findOrFail($id);
        $entity=   $this->attach($request,$entity);
        if (request()->bearerToken()) {

            $viewVars = $this->getViewVars('updattt');


            // $mergedData = array_merge($data, $viewVars);

return $this->success( $entity,__('updated_successfully'));
        } else if (request()->ajax()) {
            return 554;
			return response([
					'message' => __('updated_successfully'),
					'status'  => true,
					'id'      => $entity->id,
				], 200);
		}else
        successUpdate();
        return redirect()->route("$this->route_name.index");
    }
    catch (\Exception $e){
        if (request()->ajax()) {
            return response()->json([
                'success' => false,
                'title'  =>   __('error'),
                'message'  =>   $e->getMessage(),
            ], 422);

        }
        return redirect()->back() ->withInput() ->withErrors(['error' => $e->getMessage()]);
    }

    }
 private   function  attach($request, $entity=false){



    $request_data = $request->all();

    // $request_data=   FieldTrans($request_data);

    $request_data=  FieldBoolean($request_data,        $this->data-> boolean??[]);
    if($this->entity->trans)
    $request_data=$this->entity->setField($request_data);
    $request_data=  $this-> setRequestData($request_data);
    if(!$entity)
    $entity = $this->EntityModel::create($request_data);
    else
    $entity->update($request_data);
    $this->afterSave( $entity);
   $this-> attachDropzone($entity);

// if($entity->translatable)
//     setTrans($entity);

if( $entity->has_attachable)
    $entity->attachMultiple();


return   $entity;
 }

 public   function  setRequestData($request_data){
    return $request_data;
}
public   function  beforeShow($entity){

}
 public   function  afterSave($entity){
    // $request_data = request()->all();
}
public   function  beforeSave($entity){
    // $request_data = request()->all();
}
    public   function  attachDropzone($entity){
    // Unset or Remove Dropzone request

       $dz_type = 'create';
       $dz_id = request("dz_id");
        // rename or move files from tempfile Folder after Add record
       if ($dz_type == "create") {
           FileUploader()->rename(class_basename($entity), $dz_id, $entity->id);
       }
}

public function getViewVars($view)
    {

$entity=$this->entity;

        return compact( 'entity');
    }

public function setFields( )
{
    return [ ];
}

}
